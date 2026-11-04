import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { pool } from '../db.js';
import { startSession, endSession, requireAuth } from '../middleware/auth.js';

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8).max(100),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
});

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });

router.post('/register', limiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please check your details. Password must be at least 8 characters.' });
    const { name, email, phone, password } = parsed.data;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, 12);
    // Role is always "customer" here. It is never read from the request.
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, hash]
    );
    const user = { id: result.insertId, name, email, phone: phone || null, role: 'customer' };
    startSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter your email and password' });
    const { email, password } = parsed.data;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    const user = rows[0];
    // Same message for "no such user" and "wrong password".
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password' });

    startSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/logout', (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;