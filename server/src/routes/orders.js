import { Router } from "express";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Mock payments are for development only. The server refuses to start with them in production.
const MOCK = process.env.PAYMENT_MODE === "mock";
if (MOCK && process.env.NODE_ENV === "production") {
  throw new Error("PAYMENT_MODE=mock is not allowed in production");
}

const router = Router();
router.use(requireAuth);

let client;
const getRazorpay = () =>
  (client ??= new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  }));

const orderSchema = z.object({
  lines: z
    .array(
      z.object({
        slug: z.string().max(120),
        size: z.number().int().positive(),
        qty: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(50),
  address: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s]{10,15}$/),
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z
      .string()
      .trim(),
  }),
  paymentMethod: z.enum(["online", "cod"]).default("online"),
});

// Marks an order paid exactly once and reduces stock. Safe to call twice
// (the browser confirmation and, later, the Razorpay webhook may both arrive).
export async function markPaid(orderId, paymentId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `UPDATE orders SET status = 'paid', razorpay_payment_id = ?, paid_at = NOW()
       WHERE id = ? AND status = 'pending_payment'`,
      [paymentId, orderId],
    );
    if (r.affectedRows) {
      await conn.query(
        `UPDATE product_packs k JOIN order_items i ON i.pack_id = k.id
         SET k.stock = GREATEST(k.stock - i.qty, 0) WHERE i.order_id = ?`,
        [orderId],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Cash on delivery: the order is confirmed straight away and stock is reduced.
// paid_at stays empty because nothing has been paid yet.
async function placeCod(orderId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending_payment'`,
      [orderId],
    );
    if (r.affectedRows) {
      await conn.query(
        `UPDATE product_packs k JOIN order_items i ON i.pack_id = k.id
         SET k.stock = GREATEST(k.stock - i.qty, 0) WHERE i.order_id = ?`,
        [orderId],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Emails the company when an order is placed.
// It never throws: a failed email must not fail the customer's order.
async function notifyCompany(orderId, address, items, totalPaise) {
  const { BREVO_API_KEY, MAIL_FROM, ORDER_NOTIFY_EMAIL } = process.env;
  if (!BREVO_API_KEY || !MAIL_FROM || !ORDER_NOTIFY_EMAIL) {
    console.warn("Order email skipped: email settings are missing");
    return;
  }
  try {
    const itemLines = items
      .map((i) => `- ${i.name} ${i.size} kg x ${i.qty} = Rs ${(i.unitPaise * i.qty) / 100}`)
      .join("\n");
    const text = [
      `New order #${orderId} (Cash on Delivery)`,
      "",
      itemLines,
      "",
      `Total: Rs ${totalPaise / 100}`,
      "",
      "Deliver to:",
      address.name,
      `Phone: ${address.phone}`,
      address.line1,
      address.line2 || "",
      `${address.city}, ${address.state} - ${address.pincode}`,
    ].join("\n");

    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Jayakrishna Orders", email: MAIL_FROM },
        to: [{ email: ORDER_NOTIFY_EMAIL }],
        subject: `New order #${orderId} (Cash on Delivery)`,
        textContent: text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error("Order email failed:", r.status, await r.text());
  } catch (err) {
    console.error("Order email failed:", err.message);
  }
}

// Create an order (and a Razorpay order unless in mock mode). Prices come from the database only.
  router.post("/", async (req, res, next) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "Please check your cart and delivery details" });
  const { lines, address, paymentMethod } = parsed.data;

  const merged = new Map(); // combine duplicate lines
  for (const l of lines) {
    const key = `${l.slug}:${l.size}`;
    merged.set(key, { ...l, qty: (merged.get(key)?.qty || 0) + l.qty });
  }

  const conn = await pool.getConnection();
  try {
    const items = [];
    for (const l of merged.values()) {
      const [rows] = await conn.query(
        `SELECT k.id AS pack_id, k.sku, k.price, k.stock, p.name
         FROM product_packs k JOIN products p ON p.id = k.product_id
         WHERE p.slug = ? AND k.size_kg = ? AND p.is_active = 1 AND k.is_active = 1`,
        [l.slug, l.size],
      );
      const r = rows[0];
      if (!r)
        return res
          .status(400)
          .json({ error: "An item in your cart is no longer available" });
      if (r.price == null)
        return res
          .status(400)
          .json({
            error: `${r.name} ${l.size} kg cannot be ordered online yet`,
          });
      if (r.stock < l.qty)
        return res
          .status(409)
          .json({ error: `Only ${r.stock} left of ${r.name} ${l.size} kg` });
      items.push({
        ...r,
        size: l.size,
        qty: l.qty,
        unitPaise: Math.round(r.price * 100),
      });
    }

    // Work in paise (whole numbers) so rupee amounts never pick up rounding errors.
    const subtotalPaise = items.reduce((n, i) => n + i.unitPaise * i.qty, 0);
    const totalPaise = subtotalPaise; // shipping and tax get added once the client confirms the rules

    await conn.beginTransaction();
    const [o] = await conn.query(
      `INSERT INTO orders (user_id, payment_method, subtotal, total, ship_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        paymentMethod,
        subtotalPaise / 100,
        totalPaise / 100,
        address.name,
        address.phone,
        address.line1,
        address.line2 || null,
        address.city,
        address.state,
        address.pincode,
      ],
    );
    for (const i of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, pack_id, product_name, size_kg, sku, unit_price, qty, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.insertId,
          i.pack_id,
          i.name,
          i.size,
          i.sku,
          i.unitPaise / 100,
          i.qty,
          (i.unitPaise * i.qty) / 100,
        ],
      );
    }
    await conn.commit();

    if (paymentMethod === "cod") {
      await placeCod(o.insertId);
      await notifyCompany(o.insertId, address, items, totalPaise);
      return res
        .status(201)
        .json({ mode: "cod", orderId: o.insertId, amount: totalPaise, currency: "INR" });
    }

    if (MOCK) {
      return res
        .status(201)
        .json({
          mode: "mock",
          orderId: o.insertId,
          amount: totalPaise,
          currency: "INR",
        });
    }

    const rzp = await getRazorpay().orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: `JK-${o.insertId}`,
      notes: { orderId: String(o.insertId) },
    });
    await pool.query("UPDATE orders SET razorpay_order_id = ? WHERE id = ?", [
      rzp.id,
      o.insertId,
    ]);

    res.status(201).json({
      mode: "razorpay",
      orderId: o.insertId,
      razorpayOrderId: rzp.id,
      amount: totalPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    next(err);
  } finally {
    conn.release();
  }
});

// Development only: pretend the payment succeeded.
router.post("/:id/mock-pay", async (req, res, next) => {
  try {
    if (!MOCK) return res.status(404).json({ error: "Not found" });
    const [rows] = await pool.query(
      "SELECT id FROM orders WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );
    if (!rows.length) return res.status(404).json({ error: "Order not found" });
    await markPaid(rows[0].id, `mock_${Date.now()}`);
    res.json({ ok: true, orderId: rows[0].id });
  } catch (err) {
    next(err);
  }
});

// The browser calls this after Razorpay's popup succeeds. The signature proves the payment is real.
router.post("/:id/verify", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
      })
      .safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Invalid payment details" });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    const [rows] = await pool.query(
      "SELECT id, razorpay_order_id FROM orders WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );
    const order = rows[0];
    if (!order || order.razorpay_order_id !== razorpay_order_id)
      return res.status(404).json({ error: "Order not found" });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    await markPaid(order.id, razorpay_payment_id);
    res.json({ ok: true, orderId: order.id });
  } catch (err) {
    next(err);
  }
});

// The signed-in customer's own orders.
router.get("/", async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      "SELECT id, status, total, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY id DESC",
      [req.user.id],
    );
    if (!orders.length) return res.json([]);
    const [items] = await pool.query(
      `SELECT order_id, product_name, size_kg, qty, unit_price, line_total
       FROM order_items WHERE order_id IN (?)`,
      [orders.map((o) => o.id)],
    );
    res.json(
      orders.map((o) => ({
        ...o,
        items: items.filter((i) => i.order_id === o.id),
      })),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
