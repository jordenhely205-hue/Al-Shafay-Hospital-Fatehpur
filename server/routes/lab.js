import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getDb, updateDb } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

let broadcastEvent = () => {};
export function setLabBroadcastFn(fn) {
  broadcastEvent = fn;
}

// Multer Storage for Scans and X-Rays
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/scans');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const uniqueName = `scan-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Upload Scan Image endpoint
router.post('/upload-scan', upload.single('scanImage'), (req, res) => {
  try {
    if (req.file) {
      const fileUrl = `/uploads/scans/${req.file.filename}`;
      return res.json({
        success: true,
        imageUrl: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    }

    // Base64 upload fallback if sent as JSON body
    if (req.body && req.body.base64Data) {
      const base64Str = req.body.base64Data;
      const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'png';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `scan-${Date.now()}-${uuidv4().slice(0, 8)}.${ext}`;
        const uploadPath = path.join(__dirname, '../uploads/scans', filename);
        fs.writeFileSync(uploadPath, buffer);
        const fileUrl = `/uploads/scans/${filename}`;
        return res.json({
          success: true,
          imageUrl: fileUrl,
          filename
        });
      }
      return res.json({ success: true, imageUrl: base64Str });
    }

    res.status(400).json({ success: false, message: 'No file or image data provided' });
  } catch (err) {
    console.error("Scan upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Lab Catalog
router.get('/catalog', (req, res) => {
  const db = getDb();
  res.json({ success: true, catalog: db.labTestCatalog || [] });
});

// Get Lab Orders
router.get('/orders', (req, res) => {
  const { status, patientId, date, doctorId } = req.query;
  const db = getDb();
  let list = db.labOrders || [];

  if (status) list = list.filter(o => o.status === status);
  if (patientId) list = list.filter(o => o.patientId === patientId);
  if (doctorId) list = list.filter(o => o.doctorId === doctorId);

  res.json({
    success: true,
    orders: list.reverse(),
    stats: {
      total: list.length,
      pending: (db.labOrders || []).filter(o => o.status === 'PENDING').length,
      inProgress: (db.labOrders || []).filter(o => o.status === 'SAMPLE_COLLECTED' || o.status === 'IN_PROGRESS').length,
      completed: (db.labOrders || []).filter(o => o.status === 'COMPLETED').length
    }
  });
});

// Update Order Status
router.patch('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, specimenBarcode } = req.body;
  const db = getDb();
  let updatedOrder = null;

  updateDb(d => {
    const idx = (d.labOrders || []).findIndex(o => o.id === id);
    if (idx !== -1) {
      d.labOrders[idx].status = status;
      if (specimenBarcode) d.labOrders[idx].specimenBarcode = specimenBarcode;
      if (status === 'SAMPLE_COLLECTED') d.labOrders[idx].sampleCollectedAt = new Date().toISOString();
      updatedOrder = d.labOrders[idx];
    }
  });

  if (!updatedOrder) {
    return res.status(404).json({ success: false, message: 'Lab order not found' });
  }

  broadcastEvent({
    type: 'LAB_ORDER_UPDATED',
    order: updatedOrder
  });

  res.json({ success: true, order: updatedOrder });
});

// Submit / Complete Lab & Radiology Test Results (with Scans / Images)
router.post('/orders/:id/results', (req, res) => {
  const { id } = req.params;
  const { parameters, technicianNotes, pathologistRemarks, verifiedBy, images, specimenBarcode } = req.body;
  const db = getDb();
  let updatedOrder = null;
  const now = new Date().toISOString();

  updateDb(d => {
    const idx = (d.labOrders || []).findIndex(o => o.id === id);
    if (idx !== -1) {
      d.labOrders[idx] = {
        ...d.labOrders[idx],
        parameters: parameters || d.labOrders[idx].parameters,
        images: images || d.labOrders[idx].images || [],
        specimenBarcode: specimenBarcode || d.labOrders[idx].specimenBarcode || `SPEC-${id.slice(-6).toUpperCase()}`,
        technicianNotes: technicianNotes || '',
        pathologistRemarks: pathologistRemarks || 'Verified by Pathologist / Radiologist',
        verifiedBy: verifiedBy || 'Kashif Rasheed (Sr. Technologist)',
        status: 'COMPLETED',
        completedAt: now
      };
      updatedOrder = d.labOrders[idx];
    }
  });

  if (!updatedOrder) {
    return res.status(404).json({ success: false, message: 'Lab order not found' });
  }

  broadcastEvent({
    type: 'LAB_RESULT_READY',
    order: updatedOrder
  });

  res.json({ success: true, order: updatedOrder });
});

// Get single order with verified format
router.get('/orders/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const order = (db.labOrders || []).find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Lab order not found' });
  }

  res.json({
    success: true,
    order,
    hospitalInfo: db.hospitalInfo
  });
});

export default router;
