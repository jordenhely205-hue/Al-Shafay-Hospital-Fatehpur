import express from 'express';
import { getDb, updateDb } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

let broadcastEvent = () => {};
export function setPharmacyBroadcastFn(fn) {
  broadcastEvent = fn;
}

// Get medicine catalog / inventory
router.get('/inventory', (req, res) => {
  const { q, category } = req.query;
  const db = getDb();
  let list = db.medicines || [];

  if (category) {
    list = list.filter(m => m.category === category);
  }
  if (q) {
    const query = q.toLowerCase().trim();
    list = list.filter(m =>
      m.brandName.toLowerCase().includes(query) ||
      m.genericName.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );
  }

  const lowStock = (db.medicines || []).filter(m => m.stockQuantity <= m.reorderLevel);
  const now = new Date();
  const expiringSoon = (db.medicines || []).filter(m => {
    if (!m.expiryDate) return false;
    const diffDays = (new Date(m.expiryDate) - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays > 0;
  });

  res.json({
    success: true,
    medicines: list,
    stats: {
      totalMedicines: db.medicines.length,
      totalStockCount: db.medicines.reduce((sum, m) => sum + (m.stockQuantity || 0), 0),
      lowStockCount: lowStock.length,
      expiringCount: expiringSoon.length,
      lowStockItems: lowStock,
      expiringItems: expiringSoon
    }
  });
});

// Add new medicine to inventory
router.post('/inventory', (req, res) => {
  const {
    brandName,
    genericName,
    category,
    dosageForm,
    strength,
    unitPrice,
    costPrice,
    stockQuantity,
    reorderLevel,
    batchNumber,
    expiryDate,
    manufacturer,
    locationShelf
  } = req.body;

  if (!brandName || !unitPrice) {
    return res.status(400).json({ success: false, message: 'Brand name and unit price are required' });
  }

  const newMedicine = {
    id: 'med-' + uuidv4().slice(0, 8),
    brandName,
    genericName: genericName || brandName,
    category: category || 'General Medicine',
    dosageForm: dosageForm || 'Tablet',
    strength: strength || '',
    unitPrice: Number(unitPrice) || 0,
    costPrice: Number(costPrice) || 0,
    stockQuantity: Number(stockQuantity) || 0,
    reorderLevel: Number(reorderLevel) || 20,
    batchNumber: batchNumber || 'BAT-' + Math.floor(1000 + Math.random() * 9000),
    expiryDate: expiryDate || '2028-12-31',
    manufacturer: manufacturer || 'Standard Pharma',
    locationShelf: locationShelf || 'Shelf A'
  };

  updateDb(d => {
    if (!d.medicines) d.medicines = [];
    d.medicines.push(newMedicine);
  });

  res.json({ success: true, medicine: newMedicine });
});

// Update stock or medicine details
router.put('/inventory/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  let updatedMed = null;

  updateDb(d => {
    const idx = (d.medicines || []).findIndex(m => m.id === id);
    if (idx !== -1) {
      d.medicines[idx] = {
        ...d.medicines[idx],
        ...updateData,
        unitPrice: Number(updateData.unitPrice !== undefined ? updateData.unitPrice : d.medicines[idx].unitPrice),
        stockQuantity: Number(updateData.stockQuantity !== undefined ? updateData.stockQuantity : d.medicines[idx].stockQuantity),
        reorderLevel: Number(updateData.reorderLevel !== undefined ? updateData.reorderLevel : d.medicines[idx].reorderLevel)
      };
      updatedMed = d.medicines[idx];
    }
  });

  if (!updatedMed) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }

  res.json({ success: true, medicine: updatedMed });
});

// Get prescriptions pending dispensing
router.get('/pending-prescriptions', (req, res) => {
  const db = getDb();
  const list = (db.prescriptions || []).filter(p => p.dispensedStatus !== 'DISPENSED');
  res.json({ success: true, prescriptions: list.reverse() });
});

// Dispense Prescription & Generate Pharmacy Invoice
router.post('/dispense', (req, res) => {
  const {
    prescriptionId,
    patientId,
    patientName,
    patientPhone,
    doctorName,
    items, // [ { medicineId, brandName, quantity, unitPrice, instructions } ]
    discountPercent,
    taxPercent,
    paymentMethod,
    dispensedBy
  } = req.body;

  if (!patientName || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid dispensing request' });
  }

  const db = getDb();
  const now = new Date().toISOString();
  const count = (db.pharmacyInvoices || []).length + 5001;
  const invoiceNumber = `INV-PHARM-${count}`;

  let subtotal = 0;
  const calculatedItems = items.map(it => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.unitPrice) || 0;
    const total = qty * price;
    subtotal += total;

    // Find medicine batch details
    const medStock = (db.medicines || []).find(m => m.id === it.medicineId || m.brandName.toLowerCase() === (it.brandName || '').toLowerCase());

    return {
      medicineId: it.medicineId || (medStock ? medStock.id : ''),
      brandName: it.brandName || (medStock ? medStock.brandName : 'Medicine'),
      genericName: medStock ? medStock.genericName : '',
      batchNumber: medStock ? medStock.batchNumber : 'N/A',
      dosageForm: medStock ? medStock.dosageForm : 'Unit',
      quantity: qty,
      unitPrice: price,
      totalPrice: total,
      instructions: it.instructions || ''
    };
  });

  const discP = Number(discountPercent) || 0;
  const discountAmount = (subtotal * discP) / 100;
  const taxP = Number(taxPercent) || 0;
  const taxAmount = ((subtotal - discountAmount) * taxP) / 100;
  const netTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const newInvoice = {
    id: 'inv-' + uuidv4().slice(0, 8),
    invoiceNumber,
    prescriptionId: prescriptionId || '',
    patientId: patientId || '',
    patientName,
    patientPhone: patientPhone || '',
    doctorName: doctorName || 'Hospital Doctor',
    items: calculatedItems,
    subtotal,
    discountPercent: discP,
    discountAmount,
    taxPercent: taxP,
    taxAmount,
    netTotal: Math.round(netTotal),
    paymentMethod: paymentMethod || 'CASH',
    paymentStatus: 'PAID',
    dispensedBy: dispensedBy || 'Hamza Bilal (R.Ph)',
    createdAt: now
  };

  updateDb(d => {
    if (!d.pharmacyInvoices) d.pharmacyInvoices = [];
    d.pharmacyInvoices.push(newInvoice);

    // Deduct inventory quantities
    calculatedItems.forEach(item => {
      if (item.medicineId) {
        const medIdx = (d.medicines || []).findIndex(m => m.id === item.medicineId);
        if (medIdx !== -1) {
          d.medicines[medIdx].stockQuantity = Math.max(0, d.medicines[medIdx].stockQuantity - item.quantity);
        }
      }
    });

    // Mark prescription as dispensed
    if (prescriptionId) {
      const pIdx = (d.prescriptions || []).findIndex(p => p.id === prescriptionId);
      if (pIdx !== -1) {
        d.prescriptions[pIdx].dispensedStatus = 'DISPENSED';
        d.prescriptions[pIdx].dispensedAt = now;
        d.prescriptions[pIdx].invoiceId = newInvoice.id;
      }
    }
  });

  broadcastEvent({
    type: 'PRESCRIPTION_DISPENSED',
    invoice: newInvoice,
    prescriptionId
  });

  res.json({
    success: true,
    message: 'Prescription dispensed and invoice generated',
    invoice: newInvoice
  });
});

// List all invoices
router.get('/invoices', (req, res) => {
  const db = getDb();
  res.json({
    success: true,
    invoices: (db.pharmacyInvoices || []).slice().reverse()
  });
});

// Get invoice by ID
router.get('/invoices/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const invoice = (db.pharmacyInvoices || []).find(i => i.id === id || i.invoiceNumber === id);

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  res.json({
    success: true,
    invoice,
    hospitalInfo: db.hospitalInfo
  });
});

export default router;
