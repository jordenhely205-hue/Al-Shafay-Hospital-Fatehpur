import express from 'express';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

let broadcastEvent = () => {};
export function setAppointmentBroadcastFn(fn) {
  broadcastEvent = fn;
}

// Book online appointment (Public & Reception)
router.post('/book', (req, res) => {
  const { patientName, phone, cnic, departmentId, doctorId, date, timeSlot, notes, source } = req.body;

  if (!patientName || !phone || !doctorId || !date || !timeSlot) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  const db = getDb();
  const doctor = db.doctors.find(d => d.id === doctorId);
  const department = db.departments.find(d => d.id === departmentId) || (doctor ? db.departments.find(d => d.id === doctor.departmentId) : null);

  const count = (db.appointments || []).length + 1001;
  const appointmentNumber = `APT-${count}`;
  const now = new Date().toISOString();

  const newAppointment = {
    id: 'apt-' + uuidv4().slice(0, 8),
    appointmentNumber,
    patientName: patientName.trim(),
    phone: phone.trim(),
    cnic: cnic ? cnic.trim() : '',
    departmentId: department ? department.id : '',
    departmentName: department ? department.name : 'General',
    doctorId: doctor ? doctor.id : '',
    doctorName: doctor ? doctor.name : 'Consultant',
    doctorRoom: doctor ? doctor.roomNumber : 'Room 101',
    appointmentDate: date,
    date,
    timeSlot,
    notes: notes || '',
    source: source || 'ONLINE',
    bookingType: 'ONLINE',
    isOnline: true,
    status: 'PENDING_CONFIRMATION', // PENDING_CONFIRMATION, CONFIRMED, CHECKED_IN, CANCELLED
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        status: 'PENDING_CONFIRMATION',
        timestamp: now,
        note: 'Online booking created'
      }
    ]
  };

  updateDb(d => {
    if (!d.appointments) d.appointments = [];
    d.appointments.push(newAppointment);
  });

  // Broadcast new appointment to Reception
  broadcastEvent({
    type: 'APPOINTMENT_BOOKED',
    appointment: newAppointment
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
  const query = q.trim().toLowerCase();
  const results = (db.appointments || []).filter(a =>
    a.phone?.toLowerCase() === query ||
    a.appointmentNumber?.toLowerCase() === query ||
    (a.cnic && a.cnic.toLowerCase() === query)
  );

  res.json({ success: true, appointments: results });
});

// Summary Analytics for Daily, Monthly & Lifetime reporting
router.get('/stats', (req, res) => {
  const db = getDb();
  const appointments = db.appointments || [];
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM

  const totalBookings = appointments.length;
  const pendingCount = appointments.filter(a => String(a.status || '').toUpperCase().includes('PENDING')).length;
  const confirmedCount = appointments.filter(a => String(a.status || '').toUpperCase().includes('CONFIRM')).length;
  const checkedInCount = appointments.filter(a => String(a.status || '').toUpperCase() === 'CHECKED_IN').length;
  const cancelledCount = appointments.filter(a => String(a.status || '').toUpperCase() === 'CANCELLED').length;
  
  const todayCount = appointments.filter(a => (a.date === today || a.appointmentDate === today)).length;
  const monthCount = appointments.filter(a => (a.date && a.date.startsWith(currentMonth))).length;

  res.json({
    success: true,
    stats: {
      totalBookings,
      pendingCount,
      confirmedCount,
      checkedInCount,
      cancelledCount,
      todayCount,
      monthCount
    }
  });
});

// List all appointments with full audit trail & multi-dimensional filtering (Admin/Reception)
router.get('/', (req, res) => {
  const { date, month, startDate, endDate, doctorId, departmentId, status, search } = req.query;
  const db = getDb();
  let list = db.appointments || [];

  if (date) {
    list = list.filter(a => a.date === date || a.appointmentDate === date);
  }
  if (month) {
    list = list.filter(a => (a.date && a.date.startsWith(month)) || (a.createdAt && a.createdAt.startsWith(month)));
  }
  if (startDate && endDate) {
    list = list.filter(a => a.date >= startDate && a.date <= endDate);
  }
  if (doctorId) {
    list = list.filter(a => a.doctorId === doctorId);
  }
  if (departmentId) {
    list = list.filter(a => a.departmentId === departmentId);
  }
  if (status && status !== 'ALL') {
    list = list.filter(a => (a.status || '').toLowerCase().includes(status.toLowerCase()));
  }
  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(a => 
      a.patientName?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.appointmentNumber?.toLowerCase().includes(q) ||
      a.doctorName?.toLowerCase().includes(q) ||
      a.confirmedTokenNumber?.toString().includes(q)
    );
  }

  // Ensure normalized schema fields for zero-bug frontend consumption
  const normalized = list.map(a => ({
    ...a,
    appointmentDate: a.appointmentDate || a.date,
    status: a.status || 'PENDING_CONFIRMATION',
    isOnline: a.isOnline !== undefined ? a.isOnline : true,
    bookingType: a.bookingType || 'ONLINE',
    source: a.source || 'ONLINE'
  }));

  res.json({ success: true, count: normalized.length, appointments: normalized.slice().reverse() });
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

  const now = new Date().toISOString();
  let updatedApt = null;

  updateDb(d => {
    const target = d.appointments.find(a => a.id === id || a.appointmentNumber === id);
    if (target) {
      if (tokenNumber) target.confirmedTokenNumber = tokenNumber;
      if (date) {
        target.date = date;
        target.appointmentDate = date;
      }
      if (timeSlot) target.timeSlot = timeSlot;
      if (doctorRoom) target.doctorRoom = doctorRoom;
      if (notes !== undefined) target.notes = notes;
      target.status = 'CONFIRMED';
      target.confirmedAt = now;
      target.updatedAt = now;
      if (!target.statusHistory) target.statusHistory = [];
      target.statusHistory.push({
        status: 'CONFIRMED',
        timestamp: now,
        tokenNumber: tokenNumber || target.confirmedTokenNumber,
        note: 'Confirmed by receptionist & WhatsApp dispatched'
      });
      updatedApt = { ...target };
    }
  });

  // Broadcast update to Reception
  broadcastEvent({
    type: 'APPOINTMENT_UPDATED',
    appointment: updatedApt || apt
  });

  res.json({
    success: true,
    message: 'Appointment confirmed successfully',
    appointment: updatedApt || apt
  });
});

// Soft Delete / Cancel Policy (Zero Data Loss - Permanent Audit Log)
router.patch('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = getDb();
  const apt = (db.appointments || []).find(a => a.id === id || a.appointmentNumber === id);
  if (!apt) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  const now = new Date().toISOString();
  let updatedApt = null;

  updateDb(d => {
    const target = d.appointments.find(a => a.id === id || a.appointmentNumber === id);
    if (target) {
      target.status = 'CANCELLED';
      target.cancelledAt = now;
      target.updatedAt = now;
      target.cancellationReason = reason || 'Cancelled by user or staff';
      if (!target.statusHistory) target.statusHistory = [];
      target.statusHistory.push({
        status: 'CANCELLED',
        timestamp: now,
        reason: target.cancellationReason
      });
      updatedApt = { ...target };
    }
  });

  broadcastEvent({
    type: 'APPOINTMENT_UPDATED',
    appointment: updatedApt || apt
  });

  res.json({
    success: true,
    message: 'Appointment marked as cancelled in audit history',
    appointment: updatedApt || apt
  });
});

// Compatibility route for DELETE: performs soft cancellation, never drops records
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const apt = (db.appointments || []).find(a => a.id === id || a.appointmentNumber === id);
  if (!apt) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  const now = new Date().toISOString();
  let updatedApt = null;

  updateDb(d => {
    const target = d.appointments.find(a => a.id === id || a.appointmentNumber === id);
    if (target) {
      target.status = 'CANCELLED';
      target.cancelledAt = now;
      target.updatedAt = now;
      target.cancellationReason = req.body?.reason || 'Soft deleted / Cancelled';
      if (!target.statusHistory) target.statusHistory = [];
      target.statusHistory.push({
        status: 'CANCELLED',
        timestamp: now,
        note: 'Soft deleted from active list'
      });
      updatedApt = { ...target };
    }
  });

  broadcastEvent({
    type: 'APPOINTMENT_UPDATED',
    appointment: updatedApt || apt
  });

  res.json({
    success: true,
    message: 'Appointment archived as cancelled (permanent record preserved)',
    appointment: updatedApt || apt
  });
});

export default router;



