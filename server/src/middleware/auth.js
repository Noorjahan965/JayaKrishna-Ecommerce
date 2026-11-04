import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const COOKIE = 'jk_token';
const WEEK = 7 * 24 * 60 * 60 * 1000;

export function startSession(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK,
  });
}

export function endSession(res) {
  res.clearCookie(COOKIE);
}

// Loads the user from the database on every request, so a role change or a
// deactivated account takes effect immediately.
export async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: 'Please sign in' });
  try {
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = ? AND is_active = 1',
      [sub]
    );
    if (!rows.length) return res.status(401).json({ error: 'Please sign in' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
  next();
}