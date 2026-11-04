import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const bad = (res, msg = 'Please check the details you entered') => res.status(400).json({ error: msg });
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const skuCode = (slug) => slug.replace(/[^a-z0-9]/g, '').slice(0, 10).toUpperCase();
const money = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : null);

// Column names come from the validated schemas below, never from raw request keys.
async function patch(table, id, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (!keys.length) return 1;
  const [r] = await pool.query(
    `UPDATE ${table} SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...keys.map((k) => data[k]), id]
  );
  return r.affectedRows;
}

const packNew = z.object({
  size_kg: z.number().int().min(1).max(1000),
  price: z.number().min(0).max(1000000).nullable().optional(),
  stock: z.number().int().min(0).max(1000000).optional(),
});

const fields = {
  name: z.string().trim().min(2).max(150),
  category_id: z.number().int().positive().nullable().optional(),
  facility: z.string().trim().max(150).optional(),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  image: z.string().regex(/^\/img\/[\w.\-]+$/).optional(),
  uses: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  specs: z.array(z.tuple([z.string().trim().min(1).max(100), z.string().trim().max(200)])).max(40).optional(),
  is_active: z.boolean().optional(),
};
const createBody = z.object({
  ...fields,
  brand_id: z.number().int().positive(),
  packs: z.array(packNew).min(1).max(10),
});
const updateBody = z.object({ ...fields, brand_id: z.number().int().positive() }).partial();

/* Active brands and categories for the dropdowns. */
router.get('/options', async (_req, res, next) => {
  try {
    const [brands] = await pool.query('SELECT id, name FROM brands WHERE is_active = 1 ORDER BY display_order, name');
    const [categories] = await pool.query('SELECT id, name FROM categories WHERE is_active = 1 ORDER BY display_order, name');
    res.json({ brands, categories });
  } catch (err) { next(err); }
});

/* Every product (including hidden ones) with its packs. */
router.get('/products', async (_req, res, next) => {
  try {
    const [products] = await pool.query(
      `SELECT id, slug, name, brand, brand_id, category_id, facility, tagline, description, image, uses, specs, is_active
       FROM products ORDER BY id`
    );
    const [packs] = await pool.query(
      'SELECT id, product_id, size_kg, sku, price, stock, is_active FROM product_packs ORDER BY size_kg'
    );
    res.json(products.map((p) => ({
      ...p,
      uses: p.uses || [],
      specs: p.specs || [],
      packs: packs.filter((k) => k.product_id === p.id),
    })));
  } catch (err) { next(err); }
});

/* Create a product with its first pack sizes. */
router.post('/products', async (req, res, next) => {
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) return bad(res);
  const d = parsed.data;

  const sizes = d.packs.map((p) => p.size_kg);
  if (new Set(sizes).size !== sizes.length) return bad(res, 'Each pack size can only appear once');
  const slug = slugify(d.name);
  if (!slug) return bad(res, 'Please use English letters in the product name');

  const conn = await pool.getConnection();
  try {
    const [[brand]] = await conn.query('SELECT name FROM brands WHERE id = ?', [d.brand_id]);
    if (!brand) return bad(res, 'That brand does not exist');
    if (d.category_id) {
      const [[cat]] = await conn.query('SELECT id FROM categories WHERE id = ?', [d.category_id]);
      if (!cat) return bad(res, 'That category does not exist');
    }

    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO products (slug, name, brand, brand_id, category_id, facility, tagline, description, image, uses, specs, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, d.name, brand.name, d.brand_id, d.category_id ?? null, d.facility || null, d.tagline || null,
       d.description || null, d.image || null, JSON.stringify(d.uses || []), JSON.stringify(d.specs || []),
       d.is_active === false ? 0 : 1]
    );
    const code = skuCode(slug);
    for (const p of d.packs) {
      await conn.query(
        'INSERT INTO product_packs (product_id, size_kg, sku, price, stock) VALUES (?, ?, ?, ?, ?)',
        [r.insertId, p.size_kg, `${code}-${p.size_kg}KG`, money(p.price), p.stock ?? 0]
      );
    }
    await conn.commit();
    res.status(201).json({ id: r.insertId, slug });
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A product with this name already exists' });
    next(err);
  } finally {
    conn.release();
  }
});

/* Edit a product. The web address (slug) never changes, so existing links keep working. */
router.patch('/products/:id', async (req, res, next) => {
  try {
    const parsed = updateBody.safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res);
    const data = { ...parsed.data };

    if (data.brand_id) {
      const [[b]] = await pool.query('SELECT name FROM brands WHERE id = ?', [data.brand_id]);
      if (!b) return bad(res, 'That brand does not exist');
      data.brand = b.name; // the website still reads the brand name from the product row
    }
    if (data.category_id) {
      const [[c]] = await pool.query('SELECT id FROM categories WHERE id = ?', [data.category_id]);
      if (!c) return bad(res, 'That category does not exist');
    }
    if (data.uses) data.uses = JSON.stringify(data.uses);
    if (data.specs) data.specs = JSON.stringify(data.specs);

    const n = await patch('products', id, data);
    if (!n) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/* Add a pack size to an existing product. */
router.post('/products/:id/packs', async (req, res, next) => {
  try {
    const parsed = packNew.safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res);
    const p = parsed.data;

    const [[product]] = await pool.query('SELECT slug FROM products WHERE id = ?', [id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const [[first]] = await pool.query('SELECT sku FROM product_packs WHERE product_id = ? LIMIT 1', [id]);
    const code = first ? first.sku.split('-')[0] : skuCode(product.slug);

    await pool.query(
      'INSERT INTO product_packs (product_id, size_kg, sku, price, stock) VALUES (?, ?, ?, ?, ?)',
      [id, p.size_kg, `${code}-${p.size_kg}KG`, money(p.price), p.stock ?? 0]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That pack size already exists for this product' });
    next(err);
  }
});

/* Remove a pack size, unless someone has already ordered it. */
router.delete('/packs/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return bad(res);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM order_items WHERE pack_id = ?', [id]);
    if (n) return res.status(409).json({ error: 'This pack has been ordered before, so it cannot be deleted. Switch it off with "On sale" instead.' });
    const [r] = await pool.query('DELETE FROM product_packs WHERE id = ?', [id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Pack not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;