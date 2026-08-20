import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
export const JWT_SECRET = 'al-shafay-hospital-secret-key-2026';

let broadcast = () => {};
export function setAuthBroadcastFn(fn) {
  broadcast = fn;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired session' });
    req.user = user;
    next();
  });
}

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());

  if (!user) {
    return res.status(400).json({ success: false, message: 'User not found' });
  }

  if (user.active === false) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Administrator.' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }

  let doctorDetails = null;
  if (user.doctorId) {
    doctorDetails = db.doctors.find(d => d.id === user.doctorId);
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      doctorId: user.doctorId,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      doctorId: user.doctorId,
      email: user.email,
      doctorDetails
    }
  });
});

// Quick Role Switch / Demo Login
router.post('/demo-login', (req, res) => {
  const { role, doctorId } = req.body;
  const db = getDb();
  let user;

  if (role === 'doctor' && doctorId) {
    user = db.users.find(u => (u.role === 'doctor' || u.role === 'DOCTOR') && u.doctorId === doctorId);
  } else if (role) {
    user = db.users.find(u => (u.role || '').toLowerCase() === (role || '').toLowerCase());
  }

  if (!user) {
    user = db.users[0];
  }

  let doctorDetails = null;
  if (user.doctorId) {
    doctorDetails = db.doctors.find(d => d.id === user.doctorId);
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      doctorId: user.doctorId,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      doctorId: user.doctorId,
      email: user.email,
      doctorDetails
    }
  });
});

// Get current session
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  let doctorDetails = null;
  if (user.doctorId) {
    doctorDetails = db.doctors.find(d => d.id === user.doctorId);
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      doctorId: user.doctorId,
      email: user.email,
      doctorDetails
    }
  });
});

// ==========================================
// STAFF & USER MANAGEMENT ENDPOINTS (ADMIN CRUD)
// ==========================================

// List all staff members
router.get('/users', (req, res) => {
  const db = getDb();
  const users = (db.users || []).map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    department: u.department,
    counterDesk: u.counterDesk || '',
    email: u.email,
    doctorId: u.doctorId || null,
    active: u.active !== false,
    createdAt: u.createdAt || new Date().toISOString()
  }));

  res.json({ success: true, users });
});

// Create new staff member
router.post('/users', (req, res) => {
  const { name, username, password, role, department, counterDesk, email } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Username, password, and role are required' });
  }

  const db = getDb();
  const cleanUname = username.trim().toLowerCase();

  const existing = db.users.find(u => u.username.toLowerCase() === cleanUname);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Username already in use' });
  }

  const newUser = {
    id: 'usr-' + uuidv4().slice(0, 8),
    username: cleanUname,
    password: bcrypt.hashSync(password.trim(), 10),
    name: name || cleanUname,
    role: role.toLowerCase(),
    department: department || 'General Services',
    counterDesk: counterDesk || 'Counter 1',
    email: email || `${cleanUname}@alshafayhospital.com`,
    active: true,
    createdAt: new Date().toISOString()
  };

  updateDb(d => {
    d.users.push(newUser);
  });

  broadcast({
    type: 'STAFF_UPDATED',
    action: 'CREATED',
    user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role }
  });

  res.json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
      counterDesk: newUser.counterDesk,
      active: true
    }
  });
});

// Update staff member / Reset Password
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, username, password, role, department, counterDesk, email, active } = req.body;

  let updatedUser = null;

  updateDb(d => {
    const user = d.users.find(u => u.id === id);
    if (!user) return;

    if (name) user.name = name;
    if (username) user.username = username.trim().toLowerCase();
    if (password && password.trim()) {
      user.password = bcrypt.hashSync(password.trim(), 10);
    }
    if (role) user.role = role.toLowerCase();
    if (department) user.department = department;
    if (counterDesk !== undefined) user.counterDesk = counterDesk;
    if (email) user.email = email;
    if (active !== undefined) user.active = Boolean(active);

    updatedUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      counterDesk: user.counterDesk,
      email: user.email,
      active: user.active
    };
  });

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  broadcast({
    type: 'STAFF_UPDATED',
    action: 'UPDATED',
    user: updatedUser
  });

  res.json({ success: true, user: updatedUser });
});

// Toggle user active status
router.patch('/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  let updatedUser = null;

  updateDb(d => {
    const user = d.users.find(u => u.id === id);
    if (!user) return;
    user.active = Boolean(active);
    updatedUser = { id: user.id, username: user.username, active: user.active };
  });

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, user: updatedUser });
});

// Delete staff account
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  updateDb(d => {
    d.users = d.users.filter(u => u.id !== id);
  });

  broadcast({
    type: 'STAFF_UPDATED',
    action: 'DELETED',
    userId: id
  });

  res.json({ success: true, message: 'Staff account deleted successfully' });
});

export default router;
