import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
let broadcast = () => {};

export function setDeptBroadcastFn(fn) {
  broadcast = fn;
}

// List departments
router.get('/departments', (req, res) => {
  const db = getDb();
  res.json({ success: true, departments: db.departments || [] });
});

// List doctors (supports ?departmentId= and ?onlyAvailable=true)
router.get('/doctors', (req, res) => {
  const db = getDb();
  const { departmentId, onlyAvailable } = req.query;
  let docs = db.doctors || [];

  if (departmentId) {
    docs = docs.filter(d => d.departmentId === departmentId);
  }
  if (onlyAvailable === 'true') {
    docs = docs.filter(d => d.isAvailable !== false && d.status !== 'INACTIVE' && d.status !== 'ON_LEAVE');
  }

  res.json({ success: true, doctors: docs });
});

// Add New Doctor (Admin CRUD) + Auto create user account
router.post('/doctors', (req, res) => {
  const { 
    name, 
    qualification, 
    departmentId, 
    specialization, 
    roomNumber, 
    days, 
    timing, 
    phone, 
    username, 
    password, 
    status = 'AVAILABLE' 
  } = req.body;

  if (!name || !departmentId) {
    return res.status(400).json({ success: false, message: 'Doctor name and department are required' });
  }

  const db = getDb();
  const dept = db.departments.find(d => d.id === departmentId);
  const docId = 'doc-' + uuidv4().slice(0, 8);

  const newDoc = {
    id: docId,
    name,
    qualification: qualification || 'MBBS',
    departmentId,
    departmentName: dept ? dept.name : 'General',
    specialization: specialization || (dept ? dept.name : 'General Consultant'),
    roomNumber: roomNumber || 'Room 101',
    days: days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timing: timing || '09:00 AM - 03:00 PM',
    phone: phone || '',
    status: status || 'AVAILABLE',
    isAvailable: status === 'AVAILABLE' || status === 'ACTIVE'
  };

  // If username provided, create a user login account
  const uname = username ? username.trim().toLowerCase() : ('dr.' + name.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 15);
  const plainPw = password ? password.trim() : 'doctor123';
  const hashedPw = bcrypt.hashSync(plainPw, 10);

  const newUser = {
    id: 'usr-' + uuidv4().slice(0, 8),
    username: uname,
    password: hashedPw,
    name: newDoc.name,
    role: 'doctor',
    doctorId: docId,
    department: newDoc.departmentName,
    email: `${uname}@alshafayhospital.com`,
    active: true
  };

  updateDb(d => {
    d.doctors.push(newDoc);
    // Remove any collision or add new user
    d.users = d.users.filter(u => u.username.toLowerCase() !== uname);
    d.users.push(newUser);
  });

  broadcast({
    type: 'DOCTORS_UPDATED',
    action: 'CREATED',
    doctor: newDoc
  });

  res.json({ success: true, doctor: newDoc, user: { username: uname, role: 'doctor' } });
});

// Update Existing Doctor (Admin CRUD)
router.put('/doctors/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    qualification, 
    departmentId, 
    specialization, 
    roomNumber, 
    days, 
    timing, 
    phone, 
    status, 
    isAvailable,
    username,
    password
  } = req.body;

  const db = getDb();
  let updatedDoc = null;

  updateDb(d => {
    const doc = d.doctors.find(doc => doc.id === id);
    if (!doc) return;

    if (name) doc.name = name;
    if (qualification) doc.qualification = qualification;
    if (departmentId) {
      doc.departmentId = departmentId;
      const dept = d.departments.find(dep => dep.id === departmentId);
      if (dept) doc.departmentName = dept.name;
    }
    if (specialization) doc.specialization = specialization;
    if (roomNumber) doc.roomNumber = roomNumber;
    if (days) doc.days = days;
    if (timing) doc.timing = timing;
    if (phone !== undefined) doc.phone = phone;
    if (status !== undefined) {
      doc.status = status;
      doc.isAvailable = status === 'AVAILABLE' || status === 'ACTIVE';
    }
    if (isAvailable !== undefined) {
      doc.isAvailable = Boolean(isAvailable);
      if (!isAvailable) doc.status = 'INACTIVE';
    }

    updatedDoc = doc;

    // Update associated user account if username or password provided
    const user = d.users.find(u => u.doctorId === id || (u.role === 'doctor' && u.name === doc.name));
    if (user) {
      if (name) user.name = name;
      if (username) user.username = username.trim().toLowerCase();
      if (password && password.trim()) {
        user.password = bcrypt.hashSync(password.trim(), 10);
      }
    }
  });

  if (!updatedDoc) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  broadcast({
    type: 'DOCTORS_UPDATED',
    action: 'UPDATED',
    doctor: updatedDoc
  });

  res.json({ success: true, doctor: updatedDoc });
});

// Toggle Doctor Status (Active / On Leave / Inactive)
router.patch('/doctors/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let updatedDoc = null;

  updateDb(d => {
    const doc = d.doctors.find(doc => doc.id === id);
    if (!doc) return;
    doc.status = status;
    doc.isAvailable = status === 'AVAILABLE' || status === 'ACTIVE';
    updatedDoc = doc;
  });

  if (!updatedDoc) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  broadcast({
    type: 'DOCTORS_UPDATED',
    action: 'STATUS_CHANGED',
    doctor: updatedDoc
  });

  res.json({ success: true, doctor: updatedDoc });
});

// Delete Doctor (Admin CRUD)
router.delete('/doctors/:id', (req, res) => {
  const { id } = req.params;

  updateDb(d => {
    d.doctors = d.doctors.filter(doc => doc.id !== id);
    d.users = d.users.filter(u => u.doctorId !== id);
  });

  broadcast({
    type: 'DOCTORS_UPDATED',
    action: 'DELETED',
    doctorId: id
  });

  res.json({ success: true, message: 'Doctor and login credentials removed' });
});

// Doctor Self-Profile Update (From /doctor Settings)
router.put('/doctor-profile', (req, res) => {
  const { doctorId, phone, status, timing, qualification } = req.body;
  let updatedDoc = null;

  updateDb(d => {
    const doc = d.doctors.find(doc => doc.id === doctorId);
    if (!doc) return;

    if (phone !== undefined) doc.phone = phone;
    if (status !== undefined) {
      doc.status = status;
      doc.isAvailable = status === 'AVAILABLE' || status === 'ACTIVE';
    }
    if (timing !== undefined) doc.timing = timing;
    if (qualification !== undefined) doc.qualification = qualification;
    updatedDoc = doc;
  });

  if (!updatedDoc) {
    return res.status(404).json({ success: false, message: 'Doctor profile not found' });
  }

  broadcast({
    type: 'DOCTORS_UPDATED',
    action: 'UPDATED',
    doctor: updatedDoc
  });

  res.json({ success: true, doctor: updatedDoc });
});

// Hospital Info
router.get('/hospital-info', (req, res) => {
  const db = getDb();
  res.json({ success: true, hospitalInfo: db.hospitalInfo });
});

export default router;
