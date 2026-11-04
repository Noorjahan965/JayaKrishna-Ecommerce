import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10) {
  console.error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters) in server/.env first.",
  );
  process.exit(1);
}
const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
await pool.query(
  `INSERT INTO users (name, email, password_hash, role) VALUES ('Administrator', ?, ?, 'admin')
   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
  [ADMIN_EMAIL.toLowerCase(), hash],
);
console.log(`Admin ready: ${ADMIN_EMAIL}`);
await pool.end();
