import express from 'express';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Book online appointment (Public)
router.post('/book', (req, res) => {
  const { patientName, phone, cnic, departmentId, doctorId, date, timeSlot, notes } = req.body;

  if (!patientName || !phone || !doctorId || !date || !timeSlot) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  const db = getDb();
  const doctor = db.doctors.find(d => d.id === doctorId);
  const department = db.departments.find(d => d.id === departmentId) || (doctor ? db.departments.find(d => d.id === doctor.departmentId) : null);

  const count = (db.appointments || []).length + 1001;
  const appointmentNumber = `APT-${count}`;

  const newAppointment = {
    id: 'apt-' + uuidv4().slice(0, 8),
    appointmentNumber,
    patientName,
    phone,
    cnic: cnic || '',
    departmentId: department ? department.id : '',
    departmentName: department ? department.name : 'General',
    doctorId: doctor ? doctor.id : '',
    doctorName: doctor ? doctor.name : 'Consultant',
    doctorRoom: doctor ? doctor.roomNumber : 'Room 101',
    date,
    timeSlot,
    notes: notes || '',
    status: 'PENDING_CONFIRMATION', // PENDING_CONFIRMATION, CONFIRMED, CHECKED_IN, CANCELLED
    createdAt: new Date().toISOString()
  };

  updateDb(d => {
    if (!d.appointments) d.appointments = [];
    d.appointments.push(newAppointment);
  });

  res.json({
    success: true,
    message: 'Appointment booked successfully',
    appointment: newAppointment
  });
});

// Track appointment by phone or appointmentNumber (Public)
router.get('/track', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, message: 'Please provide mobile number or appointment number' });
  }

  const db = getDb();
  const query = q.trim();
  const results = (db.appointments || []).filter(a =>
    a.phone === query ||
    a.appointmentNumber?.toLowerCase() === query.toLowerCase() ||
    (a.cnic && a.cnic === query)
  );

  res.json({ success: true, appointments: results });
});

// List all appointments (Admin/Reception)
router.get('/', (req, res) => {
  const { date, doctorId } = req.query;
  const db = getDb();
  let list = db.appointments || [];

  if (date) {
    list = list.filter(a => a.date === date);
  }
  if (doctorId) {
    list = list.filter(a => a.doctorId === doctorId);
  }

  res.json({ success: true, appointments: list.slice().reverse() });
});

// Confirm & dispatch appointment (Reception Desk)
router.patch('/:id/confirm', (req, res) => {
  const { id } = req.params;
  const { tokenNumber, date, timeSlot, doctorRoom, notes } = req.body;
  const db = getDb();
  const apt = (db.appointments || []).find(a => a.id === id || a.appointmentNumber === id);
  if (!apt) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  let updatedApt = null;
  updateDb(d => {
    const target = d.appointments.find(a => a.id === id || a.appointmentNumber === id);
    if (target) {
      if (tokenNumber) target.confirmedTokenNumber = tokenNumber;
      if (date) target.date = date;
      if (timeSlot) target.timeSlot = timeSlot;
      if (doctorRoom) target.doctorRoom = doctorRoom;
      if (notes !== undefined) target.notes = notes;
      target.status = 'CONFIRMED';
      target.confirmedAt = new Date().toISOString();
      updatedApt = { ...target };
    }
  });

  res.json({
    success: true,
    message: 'Appointment confirmed successfully',
    appointment: updatedApt || apt
  });
});

export default router;

