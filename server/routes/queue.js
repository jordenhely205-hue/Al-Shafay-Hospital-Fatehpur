import express from 'express';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper to broadcast WS messages
let broadcastEvent = () => {};
export function setBroadcastFn(fn) {
  broadcastEvent = fn;
}

// Get today's queue
router.get('/', (req, res) => {
  const { doctorId, departmentId, date, status } = req.query;
  const db = getDb();
  const targetDate = date || new Date().toISOString().split('T')[0];

  let list = (db.tokens || []).filter(t => t.date === targetDate);

  if (doctorId) {
    list = list.filter(t => t.doctorId === doctorId || (t.referredToDoctorId === doctorId && (t.status === 'REFERRED' || t.status === 'CALLING')));
  }
  if (departmentId) {
    list = list.filter(t => t.departmentId === departmentId);
  }
  if (status) {
    list = list.filter(t => t.status === status);
  }

  res.json({
    success: true,
    tokens: list,
    stats: {
      total: list.length,
      waiting: list.filter(t => t.status === 'WAITING' || t.status === 'REFERRED').length,
      calling: list.filter(t => t.status === 'CALLING').length,
      inConsultation: list.filter(t => t.status === 'IN_CONSULTATION').length,
      completed: list.filter(t => t.status === 'COMPLETED').length,
      referredToReception: list.filter(t => t.status === 'REFERRED_TO_RECEPTION').length
    }
  });
});

// Generate new token (Reception / Walk-in)
router.post('/generate', (req, res) => {
  const {
    patientId,
    patientName,
    patientPhone,
    patientCnic,
    patientAge,
    patientGender,
    departmentId,
    doctorId,
    priority,
    fee
  } = req.body;

  if (!patientName || !doctorId) {
    return res.status(400).json({ success: false, message: 'Patient Name and Assigned Doctor are required' });
  }

  const db = getDb();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTokens = (db.tokens || []).filter(t => t.date === todayStr);
  const maxTokenNumber = todayTokens.reduce((max, t) => Math.max(max, t.tokenNumber || 0), 100);
  const nextTokenNumber = maxTokenNumber + 1;

  const doctor = db.doctors.find(d => d.id === doctorId);
  const department = db.departments.find(d => d.id === departmentId) || (doctor ? db.departments.find(d => d.id === doctor.departmentId) : null);

  let patId = patientId;
  if (!patId) {
    let existingPat = db.patients.find(p => p.phone === patientPhone);
    if (!existingPat) {
      patId = 'pat-' + uuidv4().slice(0, 8);
      const count = (db.patients || []).length + 1;
      const mrn = `MRN-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
      const newPat = {
        id: patId,
        mrn,
        name: patientName,
        phone: patientPhone || '',
        cnic: patientCnic || '',
        age: Number(patientAge) || 0,
        gender: patientGender || 'Male',
        createdAt: new Date().toISOString()
      };
      updateDb(d => {
        d.patients.push(newPat);
      });
    } else {
      patId = existingPat.id;
    }
  }

  const newToken = {
    id: 'tok-' + uuidv4().slice(0, 8),
    tokenNumber: nextTokenNumber,
    date: todayStr,
    patientId: patId,
    patientName,
    patientPhone: patientPhone || '',
    patientCnic: patientCnic || '',
    patientAge: Number(patientAge) || 0,
    patientGender: patientGender || 'Male',
    departmentId: department ? department.id : '',
    departmentName: department ? department.name : 'General Medicine',
    doctorId: doctor ? doctor.id : '',
    doctorName: doctor ? doctor.name : 'Duty Doctor',
    roomNumber: doctor ? doctor.roomNumber : 'Room 101',
    priority: priority || 'NORMAL',
    status: 'WAITING',
    fee: fee !== undefined ? Number(fee) : (doctor ? doctor.consultationFee : 1000),
    createdAt: new Date().toISOString()
  };

  updateDb(d => {
    d.tokens.push(newToken);
  });

  broadcastEvent({
    type: 'QUEUE_UPDATED',
    action: 'TOKEN_CREATED',
    token: newToken
  });

  res.json({ success: true, token: newToken });
});

// Update Token Status (Calling, In Consultation, Completed)
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, doctorId } = req.body;
  const db = getDb();
  let updatedToken = null;

  updateDb(d => {
    const idx = d.tokens.findIndex(t => t.id === id);
    if (idx !== -1) {
      const now = new Date().toISOString();
      const current = d.tokens[idx];

      if (status === 'CALLING' && current.doctorId) {
        d.tokens.forEach(t => {
          if (t.doctorId === current.doctorId && t.id !== id && t.status === 'CALLING') {
            t.status = 'IN_CONSULTATION';
          }
        });
      }

      d.tokens[idx] = {
        ...current,
        status,
        calledAt: status === 'CALLING' ? now : current.calledAt,
        completedAt: status === 'COMPLETED' ? now : current.completedAt
      };
      updatedToken = d.tokens[idx];
    }
  });

  if (!updatedToken) {
    return res.status(404).json({ success: false, message: 'Token not found' });
  }

  // If status is CALLING, emit specialized announcement event with both English and Urdu payloads
  if (status === 'CALLING') {
    broadcastEvent({
      type: 'TOKEN_CALLED',
      token: updatedToken,
      announcement: {
        text: `Token number ${updatedToken.tokenNumber}, ${updatedToken.patientName}, please proceed to ${updatedToken.doctorName}, ${updatedToken.roomNumber}.`,
        urduText: `ٹوکن نمبر ${updatedToken.tokenNumber}، مریض ${updatedToken.patientName}، برائے مہربانی ڈاکٹر ${updatedToken.doctorName}، ${updatedToken.roomNumber} میں تشریف لے جائیں۔`,
        tokenNumber: updatedToken.tokenNumber,
        patientName: updatedToken.patientName,
        doctorName: updatedToken.doctorName,
        roomNumber: updatedToken.roomNumber,
        isReferral: updatedToken.referredFromDoctorName ? true : false
      }
    });
  }

  broadcastEvent({
    type: 'QUEUE_UPDATED',
    action: 'STATUS_CHANGED',
    token: updatedToken
  });

  res.json({ success: true, token: updatedToken });
});

// Step 1: Doctor Refer Action -> Status becomes REFERRED_TO_RECEPTION
router.post('/:id/refer', (req, res) => {
  const { id } = req.params;
  const { toDoctorId, notes } = req.body;
  const db = getDb();

  const toDoctor = db.doctors.find(d => d.id === toDoctorId);
  if (!toDoctor) {
    return res.status(400).json({ success: false, message: 'Target doctor not found' });
  }

  let updatedToken = null;
  updateDb(d => {
    const idx = d.tokens.findIndex(t => t.id === id);
    if (idx !== -1) {
      const orig = d.tokens[idx];
      d.tokens[idx] = {
        ...orig,
        referredFromDoctorId: orig.doctorId,
        referredFromDoctorName: orig.doctorName,
        referredToDoctorId: toDoctor.id,
        referredToDoctorName: toDoctor.name,
        targetDepartmentName: toDoctor.departmentName,
        targetRoomNumber: toDoctor.roomNumber,
        referralNotes: notes || '',
        status: 'REFERRED_TO_RECEPTION',
        referredAt: new Date().toISOString()
      };
      updatedToken = d.tokens[idx];
    }
  });

  if (!updatedToken) {
    return res.status(404).json({ success: false, message: 'Token not found' });
  }

  // Broadcast referral to reception desk
  broadcastEvent({
    type: 'QUEUE_UPDATED',
    action: 'PATIENT_REFERRED_TO_RECEPTION',
    token: updatedToken
  });

  res.json({ success: true, token: updatedToken, message: 'Patient referred. Instructed to visit Reception.' });
});

// Step 2: Receptionist Forwards Referred Patient to Doctor B with Room Re-Queueing
router.post('/:id/reception-forward', (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;
  const db = getDb();

  let updatedToken = null;
  updateDb(d => {
    const idx = d.tokens.findIndex(t => t.id === id);
    if (idx !== -1) {
      const orig = d.tokens[idx];
      const targetDoc = d.doctors.find(doc => doc.id === orig.referredToDoctorId) || d.doctors[0];

      d.tokens[idx] = {
        ...orig,
        doctorId: targetDoc.id,
        doctorName: targetDoc.name,
        departmentId: targetDoc.departmentId,
        departmentName: targetDoc.departmentName,
        roomNumber: targetDoc.roomNumber,
        priority: priority || 'EMERGENCY', // Prioritize referred patients
        status: 'CALLING',
        calledAt: new Date().toISOString(),
        receptionForwardedAt: new Date().toISOString()
      };
      updatedToken = d.tokens[idx];
    }
  });

  if (!updatedToken) {
    return res.status(404).json({ success: false, message: 'Token not found' });
  }

  // Step 3: Broadcast REFERRED_PATIENT_CALLED for Waiting TV Urdu & English announcements
  broadcastEvent({
    type: 'REFERRED_PATIENT_CALLED',
    token: updatedToken,
    announcement: {
      text: `Attention please. Referred patient Token number ${updatedToken.tokenNumber}, ${updatedToken.patientName}, please proceed to ${updatedToken.doctorName} in ${updatedToken.roomNumber} for your follow-up consultation.`,
      urduText: `توجہ فرمائیے۔ ٹوکن نمبر ${updatedToken.tokenNumber}، مریض ${updatedToken.patientName}، برائے مہربانی اگلے چیک اپ کے لیے ڈاکٹر ${updatedToken.doctorName}، ${updatedToken.roomNumber} میں تشریف لے جائیں۔`,
      tokenNumber: updatedToken.tokenNumber,
      patientName: updatedToken.patientName,
      doctorName: updatedToken.doctorName,
      roomNumber: updatedToken.roomNumber,
      isReferral: true
    }
  });

  broadcastEvent({
    type: 'QUEUE_UPDATED',
    action: 'REFERRED_PATIENT_FORWARDED',
    token: updatedToken
  });

  res.json({
    success: true,
    token: updatedToken,
    message: `Patient forwarded to ${updatedToken.doctorName} (${updatedToken.roomNumber}) and announced on TV.`
  });
});

// Waiting Room Live Queue Display feed
router.get('/live-display', (req, res) => {
  const db = getDb();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTokens = (db.tokens || []).filter(t => t.date === todayStr);

  const callingTokens = todayTokens.filter(t => t.status === 'CALLING');
  const inConsultation = todayTokens.filter(t => t.status === 'IN_CONSULTATION');
  const waitingTokens = todayTokens.filter(t => t.status === 'WAITING' || t.status === 'REFERRED');
  const referredWaitingAtReception = todayTokens.filter(t => t.status === 'REFERRED_TO_RECEPTION');
  const completedTokens = todayTokens.filter(t => t.status === 'COMPLETED');

  res.json({
    success: true,
    hospitalName: db.hospitalInfo?.name || "Al-Shafay Hospital Fatehpur",
    calling: callingTokens,
    inConsultation,
    waiting: waitingTokens,
    referredAtReception: referredWaitingAtReception,
    completed: completedTokens,
    latestCall: callingTokens[callingTokens.length - 1] || null
  });
});

export default router;
