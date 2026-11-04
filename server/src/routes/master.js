import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const bad = (res) =>
  res.status(400).json({ error: "Please check the details you entered" });
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Table and column names below come from the fixed config, never from the request.
async function insert(table, data) {
  const keys = Object.keys(data);
  const [r] = await pool.query(
    `INSERT INTO ${table} (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
    keys.map((k) => data[k]),
  );
  return r.insertId;
}
async function patch(table, id, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (!keys.length) return 1;
  const [r] = await pool.query(
    `UPDATE ${table} SET ${keys.map((k) => `\`${k}\` = ?`).join(", ")} WHERE id = ?`,
    [...keys.map((k) => data[k]), id],
  );
  return r.affectedRows;
}

const base = {
  name: z.string().trim().min(2).max(100),
  name_ta: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  display_order: z.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
};
const brandCreate = z.object({
  ...base,
  tagline: z.string().trim().max(200).optional(),
});
const categoryCreate = z.object({
  ...base,
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,100}$/)
    .optional(),
});

const KINDS = {
  brands: {
    table: "brands",
    link: "brand_id",
    label: "brand",
    create: brandCreate,
    update: brandCreate.partial(),
  },
  categories: {
    table: "categories",
    link: "category_id",
    label: "category",
    create: categoryCreate,
    update: categoryCreate.partial(),
  },
};

for (const [path, t] of Object.entries(KINDS)) {
  const dup = (res) =>
    res
      .status(409)
      .json({
        error: `A ${t.label} with that name${path === "categories" ? " or slug" : ""} already exists`,
      });

  router.get(`/${path}`, async (_req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT x.*, COUNT(p.id) AS products
         FROM ${t.table} x LEFT JOIN products p ON p.${t.link} = x.id
         GROUP BY x.id ORDER BY x.display_order, x.name`,
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  router.post(`/${path}`, async (req, res, next) => {
    try {
      const parsed = t.create.safeParse(req.body);
      if (!parsed.success) return bad(res);
      const data = { ...parsed.data };
      if (path === "categories" && !data.slug) {
        data.slug = slugify(data.name);
        if (!data.slug) return bad(res);
      }
      res.status(201).json({ id: await insert(t.table, data) });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") return dup(res);
      next(err);
    }
  });

  router.patch(`/${path}/:id`, async (req, res, next) => {
    try {
      const parsed = t.update.safeParse(req.body);
      const id = parseInt(req.params.id, 10);
      if (!parsed.success || !id) return bad(res);
      const n = await patch(t.table, id, parsed.data);
      if (!n) return res.status(404).json({ error: `${t.label} not found` });
      res.json({ ok: true });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") return dup(res);
      next(err);
    }
  });

  router.delete(`/${path}/:id`, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id) return bad(res);
      const [[{ n }]] = await pool.query(
        `SELECT COUNT(*) AS n FROM products WHERE ${t.link} = ?`,
        [id],
      );
      if (n)
        return res
          .status(409)
          .json({
            error: `This ${t.label} has ${n} product${n === 1 ? "" : "s"}. Move or remove them first.`,
          });
      const [r] = await pool.query(`DELETE FROM ${t.table} WHERE id = ?`, [id]);
      if (!r.affectedRows)
        return res.status(404).json({ error: `${t.label} not found` });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });
}

export default router;
