import "dotenv/config";
import { pool } from "../src/db.js";

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows.length > 0;
}
async function constraintExists(table, name) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [table, name],
  );
  return rows.length > 0;
}

/* ---- Brands and categories ---- */
await pool.query(`CREATE TABLE IF NOT EXISTS brands (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  name_ta VARCHAR(100) NULL,
  tagline VARCHAR(200) NULL,
  description VARCHAR(1000) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

await pool.query(`CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  name_ta VARCHAR(100) NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(1000) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

if (!(await columnExists("products", "brand_id"))) {
  await pool.query(
    "ALTER TABLE products ADD COLUMN brand_id INT UNSIGNED NULL",
  );
}
if (!(await columnExists("products", "category_id"))) {
  await pool.query(
    "ALTER TABLE products ADD COLUMN category_id INT UNSIGNED NULL",
  );
}
if (!(await constraintExists("products", "fk_products_brand"))) {
  await pool.query(
    "ALTER TABLE products ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL",
  );
}
if (!(await constraintExists("products", "fk_products_category"))) {
  await pool.query(
    "ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL",
  );
}

// Starting data. INSERT IGNORE means it never overwrites edits made in the admin.
await pool.query(
  `INSERT IGNORE INTO brands (name, name_ta, tagline, display_order)
   VALUES ('Kili', 'கிளி', 'Pure and natural wheat product', 1)`,
);
await pool.query(
  `INSERT IGNORE INTO categories (name, name_ta, slug, display_order) VALUES
   ('Maida', 'மைதா மாவு', 'maida', 1),
   ('Rava (Sooji)', 'ரவை', 'rava', 2)`,
);

// Link the existing products.
await pool.query(
  `UPDATE products p JOIN brands b ON b.name = p.brand SET p.brand_id = b.id WHERE p.brand_id IS NULL`,
);
await pool.query(
  `UPDATE products p JOIN categories c ON c.slug = 'maida' SET p.category_id = c.id
   WHERE p.category_id IS NULL AND p.slug LIKE '%maida%'`,
);
await pool.query(
  `UPDATE products p JOIN categories c ON c.slug = 'rava' SET p.category_id = c.id
   WHERE p.category_id IS NULL AND p.slug LIKE '%rava%'`,
);

console.log("Migration finished");
await pool.end();
