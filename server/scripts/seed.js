import "dotenv/config";
import { pool } from "../src/db.js";
import { products } from "../../src/data/products.js";

// INSERT IGNORE: safe to run again. It never overwrites edits made later in the admin panel.
for (const p of products) {
  await pool.query(
    `INSERT IGNORE INTO products (slug, name, brand, facility, tagline, description, image, uses, specs)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.slug,
      p.name,
      p.brand,
      p.facility,
      p.tagline,
      p.description,
      p.image,
      JSON.stringify(p.uses),
      JSON.stringify(p.specs),
    ],
  );
  const [[row]] = await pool.query("SELECT id FROM products WHERE slug = ?", [
    p.slug,
  ]);
  for (const k of p.packs) {
    await pool.query(
      "INSERT IGNORE INTO product_packs (product_id, size_kg, sku, price, stock) VALUES (?, ?, ?, ?, 100)",
      [row.id, k.size, k.sku, k.price],
    );
  }
}
console.log("Products seeded");
await pool.end();
