import express from 'express';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

let broadcastEvent = () => {};
export function setPrescriptionBroadcastFn(fn) {
  broadcastEvent = fn;
}

// Create new digital prescription
router.post('/', (req, res) => {
  const {
    tokenId,
    patientId,
    patientName,
    patientAge,
    patientGender,
    doctorId,
    doctorName,
    vitals,
    chiefComplaints,
    diagnosis,
    clinicalNotes,
    medicines,
    labTests,
    followUpDate
  } = req.body;

  if (!patientName || !doctorId) {
    return res.status(400).json({ success: false, message: 'Patient and Doctor are required' });
  }

  const db = getDb();
  const doctor = db.doctors.find(d => d.id === doctorId);
  const prescId = 'prsc-' + uuidv4().slice(0, 8);
  const now = new Date().toISOString();

  const formattedMedicines = (medicines || []).map(m => ({
    id: m.id || 'med-' + uuidv4().slice(0, 6),
    medicineId: m.medicineId || '',
    name: m.name || m.brandName,
    dosage: m.dosage || '1 Tab',
    frequency: m.frequency || '1-0-1',
    duration: m.duration || '5 Days',
    instructions: m.instructions || 'After meal',
    dispensed: false
  }));

  const newPrescription = {
    id: prescId,
    tokenId: tokenId || '',
    patientId: patientId || '',
    patientName,
    patientAge: patientAge || '',
    patientGender: patientGender || '',
    doctorId,
    doctorName: doctorName || (doctor ? doctor.name : 'Consultant'),
    doctorQualification: doctor ? doctor.qualification : '',
    doctorSpecialization: doctor ? doctor.specialization : '',
    doctorRoom: doctor ? doctor.roomNumber : '',
    vitals: vitals || { bp: '', pulse: '', temp: '', spo2: '', weight: '' },
    chiefComplaints: chiefComplaints || '',
    diagnosis: diagnosis || '',
    clinicalNotes: clinicalNotes || '',
    followUpDate: followUpDate || '',
    medicines: formattedMedicines,
    labTests: labTests || [],
    status: 'ACTIVE',
    dispensedStatus: 'PENDING',
    createdAt: now
  };

  // If lab tests ordered, generate lab orders automatically
  const createdLabOrders = [];
  if (labTests && labTests.length > 0) {
    labTests.forEach(testReq => {
      const catalogItem = (db.labTestCatalog || []).find(t => t.id === testReq.testId || t.name === testReq.testName);
      
      const parameters = catalogItem?.parameters ? catalogItem.parameters.map(p => ({
        name: p.name,
        unit: p.unit,
        referenceRange: p.referenceRange,
        value: '',
        flag: 'NORMAL'
      })) : [];

      const newOrder = {
        id: 'lab-ord-' + uuidv4().slice(0, 8),
        prescriptionId: prescId,
        tokenId: tokenId || '',
        patientId: patientId || '',
        patientName,
        patientAge: patientAge || '',
        patientGender: patientGender || '',
        doctorId,
        doctorName: doctor ? doctor.name : 'Consultant',
        testId: testReq.testId || (catalogItem ? catalogItem.id : 'custom'),
        testName: testReq.testName || (catalogItem ? catalogItem.name : 'Laboratory Test'),
        category: catalogItem ? catalogItem.category : 'General Diagnostics',
        specimenType: catalogItem ? catalogItem.specimen : 'Blood / Urine',
        fee: catalogItem ? catalogItem.fee : 500,
        status: 'PENDING', // PENDING, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED
        priority: testReq.priority || 'NORMAL',
        clinicalNotes: testReq.clinicalNotes || diagnosis || '',
        parameters,
        technicianNotes: '',
        pathologistRemarks: '',
        createdAt: now
      };
      createdLabOrders.push(newOrder);
    });
  }

  updateDb(d => {
    if (!d.prescriptions) d.prescriptions = [];
    d.prescriptions.push(newPrescription);

    if (createdLabOrders.length > 0) {
      if (!d.labOrders) d.labOrders = [];
      d.labOrders.push(...createdLabOrders);
    }

    // Also mark token completed if tokenId provided
    if (tokenId) {
      const tIdx = d.tokens.findIndex(t => t.id === tokenId);
      if (tIdx !== -1) {
        d.tokens[tIdx].status = 'COMPLETED';
        d.tokens[tIdx].completedAt = now;
        d.tokens[tIdx].prescriptionId = prescId;
        d.tokens[tIdx].followUpDate = followUpDate || '';
      }
    }
  });

  // Broadcast prescription creation to Pharmacy
  broadcastEvent({
    type: 'PRESCRIPTION_CREATED',
    prescription: newPrescription
  });

  // Broadcast Lab order to Lab tech portal
  if (createdLabOrders.length > 0) {
    broadcastEvent({
      type: 'LAB_ORDERS_CREATED',
      orders: createdLabOrders
    });
  }

  // Broadcast Queue update
  broadcastEvent({
    type: 'QUEUE_UPDATED',
    action: 'CONSULTATION_COMPLETED',
    tokenId
  });

  res.json({
    success: true,
    prescription: newPrescription,
    labOrders: createdLabOrders
  });
});

// Get prescriptions list
router.get('/', (req, res) => {
  const { patientId, doctorId, tokenId } = req.query;
  const db = getDb();
  let list = db.prescriptions || [];

  if (patientId) list = list.filter(p => p.patientId === patientId);
  if (doctorId) list = list.filter(p => p.doctorId === doctorId);
  if (tokenId) list = list.filter(p => p.tokenId === tokenId);

  res.json({ success: true, prescriptions: list.reverse() });
});

// Get prescription by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const prescription = (db.prescriptions || []).find(p => p.id === id);

  if (!prescription) {
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  res.json({ success: true, prescription });
});

export default router;
