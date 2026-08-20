import express from 'express';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Search patients
router.get('/search', (req, res) => {
  const { q } = req.query;
  const db = getDb();
  if (!q) {
    return res.json({ success: true, patients: db.patients.slice(-20).reverse() });
  }

  const query = q.toLowerCase().trim();
  const matched = (db.patients || []).filter(p => 
    (p.name && p.name.toLowerCase().includes(query)) ||
    (p.phone && p.phone.includes(query)) ||
    (p.cnic && p.cnic.includes(query)) ||
    (p.mrn && p.mrn.toLowerCase().includes(query))
  );

  res.json({ success: true, patients: matched });
});

// Get patient by ID with full EMR history
router.get('/:id/emr', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const patient = db.patients.find(p => p.id === id || p.mrn === id);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const visits = (db.tokens || []).filter(t => t.patientId === patient.id);
  const prescriptions = (db.prescriptions || []).filter(pr => pr.patientId === patient.id);
  const labOrders = (db.labOrders || []).filter(lo => lo.patientId === patient.id);
  const pharmacyInvoices = (db.pharmacyInvoices || []).filter(pi => pi.patientId === patient.id);

  res.json({
    success: true,
    patient,
    emr: {
      visits: visits.reverse(),
      prescriptions: prescriptions.reverse(),
      labOrders: labOrders.reverse(),
      pharmacyInvoices: pharmacyInvoices.reverse()
    }
  });
});

// Register new patient or update
router.post('/register', (req, res) => {
  const { name, phone, cnic, age, gender, bloodGroup, address } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone number are required' });
  }

  const db = getDb();
  // Check if existing patient by phone or CNIC
  let existing = db.patients.find(p => p.phone === phone || (cnic && p.cnic === cnic));

  if (existing) {
    // Update profile
    updateDb(d => {
      const idx = d.patients.findIndex(p => p.id === existing.id);
      if (idx !== -1) {
        d.patients[idx] = {
          ...d.patients[idx],
          name: name || d.patients[idx].name,
          age: age ? Number(age) : d.patients[idx].age,
          gender: gender || d.patients[idx].gender,
          bloodGroup: bloodGroup || d.patients[idx].bloodGroup,
          cnic: cnic || d.patients[idx].cnic,
          address: address || d.patients[idx].address
        };
        existing = d.patients[idx];
      }
    });
    return res.json({ success: true, patient: existing, isNew: false });
  }

  const count = (db.patients || []).length + 1;
  const year = new Date().getFullYear();
  const mrn = `MRN-${year}-${String(count).padStart(4, '0')}`;

  const newPatient = {
    id: 'pat-' + uuidv4().slice(0, 8),
    mrn,
    name,
    phone,
    cnic: cnic || '',
    age: Number(age) || 0,
    gender: gender || 'Male',
    bloodGroup: bloodGroup || 'Unknown',
    address: address || 'Fatehpur',
    createdAt: new Date().toISOString()
  };

  updateDb(d => {
    d.patients.push(newPatient);
  });

  res.json({ success: true, patient: newPatient, isNew: true });
});

export default router;
