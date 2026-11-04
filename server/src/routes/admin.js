import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
// Every route in this file needs a signed-in admin. The role is checked on the server.
router.use(requireAuth, requireAdmin);

const STATUSES = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];
// Allowed status changes. Anything else is rejected.
const NEXT = {
  pending_payment: ["cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
const PAID = "('paid','packed','shipped','delivered')";
const LOW_STOCK = 20;
const PAGE = 20;

const bad = (res, msg = "Invalid request") =>
  res.status(400).json({ error: msg });

// Updates only the fields that were sent. Table and column names come from the fixed schemas below, never from the request.
async function patch(table, id, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (!keys.length) return 0;
  const [r] = await pool.query(
    `UPDATE ${table} SET ${keys.map((k) => `\`${k}\` = ?`).join(", ")} WHERE id = ?`,
    [...keys.map((k) => data[k]), id],
  );
  return r.affectedRows;
}

/* ---------- Dashboard ---------- */
router.get("/stats", async (_req, res, next) => {
  try {
    const [[all]] = await pool.query(
      `SELECT COUNT(*) AS orders,
              COALESCE(SUM(CASE WHEN status IN ${PAID} THEN total END), 0) AS revenue,
              COALESCE(SUM(status = 'shipped'), 0) AS shipped,
              COALESCE(SUM(status = 'delivered'), 0) AS delivered
       FROM orders`,
    );
    const [[today]] = await pool.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders WHERE status IN ${PAID} AND DATE(paid_at) = CURDATE()`,
    );
    const [[month]] = await pool.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders WHERE status IN ${PAID} AND paid_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    );
    const [[toPack]] = await pool.query(
      "SELECT COUNT(*) AS n FROM orders WHERE status = 'paid'",
    );
    const [[customers]] = await pool.query(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'customer'",
    );

    // Revenue per day for the last 7 days, with zero-filled gaps.
    const [days] = await pool.query(
      `SELECT DATE_FORMAT(paid_at, '%Y-%m-%d') AS day, SUM(total) AS revenue
       FROM orders WHERE status IN ${PAID} AND paid_at >= CURDATE() - INTERVAL 6 DAY
       GROUP BY day`,
    );
    const byDay = new Map(days.map((d) => [d.day, d.revenue]));
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
      last7.push({ day: key, revenue: byDay.get(key) || 0 });
    }

    const [recent] = await pool.query(
      `SELECT o.id, o.status, o.total, o.created_at, u.name AS customer
       FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 5`,
    );
    const [lowStock] = await pool.query(
      `SELECT k.id, p.name, k.size_kg, k.sku, k.stock
       FROM product_packs k JOIN products p ON p.id = k.product_id
       WHERE k.is_active = 1 AND k.stock <= ? ORDER BY k.stock, p.name LIMIT 20`,
      [LOW_STOCK],
    );
    res.json({
      all,
      today,
      month,
      toPack: toPack.n,
      customers: customers.n,
      last7,
      recent,
      lowStock,
      lowStockLimit: LOW_STOCK,
    });
  } catch (err) {
    next(err);
  }
});

/* ---------- Orders ---------- */
router.get("/orders", async (req, res, next) => {
  try {
    const status = STATUSES.includes(req.query.status)
      ? req.query.status
      : null;
    const q = String(req.query.q || "")
      .trim()
      .slice(0, 100);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const where = [];
    const params = [];
    if (status) {
      where.push("o.status = ?");
      params.push(status);
    }
    if (q) {
      const like = `%${q}%`;
      where.push(
        "(o.id = ? OR u.name LIKE ? OR u.email LIKE ? OR o.ship_phone LIKE ?)",
      );
      params.push(parseInt(q, 10) || 0, like, like, like);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id ${w}`,
      params,
    );
    const [orders] = await pool.query(
      `SELECT o.id, o.status, o.total, o.created_at, o.paid_at, o.ship_name, o.ship_city,
              u.name AS customer, u.email
       FROM orders o JOIN users u ON u.id = o.user_id ${w}
       ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [...params, PAGE, (page - 1) * PAGE],
    );
    res.json({
      orders,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / PAGE)),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/orders/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return bad(res);
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS customer, u.email, u.phone AS customer_phone
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      [id],
    );
    if (!rows.length) return res.status(404).json({ error: "Order not found" });
    const [items] = await pool.query(
      "SELECT product_name, size_kg, sku, unit_price, qty, line_total FROM order_items WHERE order_id = ?",
      [id],
    );
    res.json({ ...rows[0], items });
  } catch (err) {
    next(err);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  const parsed = z.object({ status: z.enum(STATUSES) }).safeParse(req.body);
  const id = parseInt(req.params.id, 10);
  if (!parsed.success || !id) return bad(res);
  const { status } = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      "SELECT status FROM orders WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!order) {
      await conn.rollback();
      return res.status(404).json({ error: "Order not found" });
    }
    if (!NEXT[order.status].includes(status)) {
      await conn.rollback();
      return res.status(409).json({
        error: `An order that is "${order.status}" cannot be changed to "${status}"`,
      });
    }
    await conn.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    // Cancelling an order that was already paid puts its bags back in stock.
    if (status === "cancelled" && ["paid", "packed"].includes(order.status)) {
      await conn.query(
        `UPDATE product_packs k JOIN order_items i ON i.pack_id = k.id
         SET k.stock = k.stock + i.qty WHERE i.order_id = ?`,
        [id],
      );
    }
    await conn.commit();
    res.json({ ok: true, status });
  } catch (err) {
    await conn.rollback().catch(() => {});
    next(err);
  } finally {
    conn.release();
  }
});

/* ---------- Products and packs ---------- */
router.get("/products", async (_req, res, next) => {
  try {
    const [products] = await pool.query(
      "SELECT id, slug, name, brand, facility, tagline, description, image, is_active FROM products ORDER BY id",
    );
    const [packs] = await pool.query(
      "SELECT id, product_id, size_kg, sku, price, stock, is_active FROM product_packs ORDER BY size_kg",
    );
    res.json(
      products.map((p) => ({
        ...p,
        packs: packs.filter((k) => k.product_id === p.id),
      })),
    );
  } catch (err) {
    next(err);
  }
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  facility: z.string().trim().max(150).optional(),
  image: z
    .string()
    .regex(/^\/img\/[\w.\-]+$/)
    .optional(),
  is_active: z.boolean().optional(),
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res);
    const n = await patch("products", id, parsed.data);
    if (!n) return res.status(404).json({ error: "Product not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const packSchema = z.object({
  price: z.number().min(0).max(1000000).nullable().optional(),
  stock: z.number().int().min(0).max(1000000).optional(),
  is_active: z.boolean().optional(),
});

router.patch("/packs/:id", async (req, res, next) => {
  try {
    const parsed = packSchema.safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res);
    const data = { ...parsed.data };
    if (typeof data.price === "number")
      data.price = Math.round(data.price * 100) / 100;
    const n = await patch("product_packs", id, data);
    if (!n) return res.status(404).json({ error: "Pack not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Customers ---------- */
router.get("/customers", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
              COUNT(o.id) AS orders,
              COALESCE(SUM(CASE WHEN o.status IN ${PAID} THEN o.total END), 0) AS spent
       FROM users u LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.role = 'customer' GROUP BY u.id ORDER BY u.id DESC LIMIT 200`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.patch("/customers/:id", async (req, res, next) => {
  try {
    const parsed = z.object({ is_active: z.boolean() }).safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res);
    const [r] = await pool.query(
      "UPDATE users SET is_active = ? WHERE id = ? AND role = 'customer'",
      [parsed.data.is_active, id],
    );
    if (!r.affectedRows)
      return res.status(404).json({ error: "Customer not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
