import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const bad = (res, msg = 'Please check the details you entered') => res.status(400).json({ error: msg });

// Column names come from the validated schemas, never from raw request keys.
async function insert(table, data) {
  const keys = Object.keys(data);
  const [r] = await pool.query(
    `INSERT INTO ${table} (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    keys.map((k) => data[k])
  );
  return r.insertId;
}
async function patch(table, id, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (!keys.length) return 1;
  const [r] = await pool.query(
    `UPDATE ${table} SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...keys.map((k) => data[k]), id]
  );
  return r.affectedRows;
}

/* ---------- Public: anyone can see open jobs and apply ---------- */
export const careersPublic = Router();
const applyLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

careersPublic.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, title_ta, department, location, job_type, experience, openings, salary,
              overview, overview_ta, responsibilities, responsibilities_ta, requirements, requirements_ta
       FROM job_openings WHERE is_active = 1 ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

const applySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().max(2000).optional(),
});

careersPublic.post('/:id/apply', applyLimit, async (req, res, next) => {
  try {
    const parsed = applySchema.safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res, 'Please check your name and email');
    const [rows] = await pool.query('SELECT id FROM job_openings WHERE id = ? AND is_active = 1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'This vacancy is no longer open' });
    const a = parsed.data;
    await pool.query(
      'INSERT INTO job_applications (job_id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
      [id, a.name, a.email, a.phone || null, a.message || null]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

/* ---------- Admin ---------- */
export const careersAdmin = Router();
careersAdmin.use(requireAuth, requireAdmin);

const text = (max) => z.string().trim().max(max).optional();
const jobSchema = z.object({
  title: z.string().trim().min(2).max(150),
  title_ta: text(150),
  department: text(100),
  location: text(100),
  job_type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).optional(),
  experience: text(50),
  openings: z.number().int().min(1).max(500).optional(),
  salary: text(100),
  overview: text(4000),
  overview_ta: text(4000),
  responsibilities: text(4000),
  responsibilities_ta: text(4000),
  requirements: text(4000),
  requirements_ta: text(4000),
  is_active: z.boolean().optional(),
});

careersAdmin.get('/jobs', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT j.*, COUNT(a.id) AS applications
       FROM job_openings j LEFT JOIN job_applications a ON a.job_id = j.id
       GROUP BY j.id ORDER BY j.id DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

careersAdmin.post('/jobs', async (req, res, next) => {
  try {
    const parsed = jobSchema.safeParse(req.body);
    if (!parsed.success) return bad(res);
    res.status(201).json({ id: await insert('job_openings', parsed.data) });
  } catch (err) { next(err); }
});

careersAdmin.patch('/jobs/:id', async (req, res, next) => {
  try {
    const parsed = jobSchema.partial().safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res);
    const n = await patch('job_openings', id, parsed.data);
    if (!n) return res.status(404).json({ error: 'Vacancy not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

careersAdmin.delete('/jobs/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return bad(res);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM job_applications WHERE job_id = ?', [id]);
    if (n) return res.status(409).json({ error: `This vacancy has ${n} application${n === 1 ? '' : 's'}. Switch it to Hidden instead of deleting it.` });
    const [r] = await pool.query('DELETE FROM job_openings WHERE id = ?', [id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Vacancy not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

careersAdmin.get('/applications', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.name, a.email, a.phone, a.message, a.status, a.created_at, j.title AS job
       FROM job_applications a JOIN job_openings j ON j.id = a.job_id
       ORDER BY a.id DESC LIMIT 300`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

careersAdmin.patch('/applications/:id', async (req, res, next) => {
  try {
    const parsed = z.object({ status: z.enum(['new', 'reviewed', 'shortlisted', 'rejected']) }).safeParse(req.body);
    const id = parseInt(req.params.id, 10);
    if (!parsed.success || !id) return bad(res);
    const n = await patch('job_applications', id, parsed.data);
    if (!n) return res.status(404).json({ error: 'Application not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});