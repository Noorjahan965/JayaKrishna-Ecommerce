import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Returns products in the same shape the frontend already uses (data/products.js).
async function load(whereSql = '', params = []) {
  const [products] = await pool.query(
    `SELECT id, slug, name, brand, facility, tagline, description, image, uses, specs
     FROM products WHERE is_active = 1 ${whereSql} ORDER BY id`,
    params
  );
  if (!products.length) return [];
  const [packs] = await pool.query(
    `SELECT product_id, size_kg AS size, sku, price, stock
     FROM product_packs WHERE is_active = 1 AND product_id IN (?) ORDER BY size_kg`,
    [products.map((p) => p.id)]
  );
  return products.map((p) => ({
    ...p,
    packs: packs
      .filter((k) => k.product_id === p.id)
      .map(({ product_id, stock, ...k }) => ({ ...k, inStock: stock > 0 })),
  }));
}

router.get('/', async (_req, res, next) => {
  try { res.json(await load()); } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const [product] = await load('AND slug = ?', [req.params.slug]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
});

export default router;