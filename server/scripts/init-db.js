import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const db = process.env.DB_NAME;

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});
await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`USE \`${db}\``);
await conn.query(sql);
await conn.end();
console.log(`Database "${db}" is ready`);