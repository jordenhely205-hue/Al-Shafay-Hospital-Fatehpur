import express from 'express';
import { getDb } from '../database/db.js';

const router = express.Router();

router.get('/overview', (req, res) => {
  const db = getDb();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTokens = (db.tokens || []).filter(t => t.date === todayStr);
  const totalPatientsToday = todayTokens.length;
  const completedToday = todayTokens.filter(t => t.status === 'COMPLETED').length;
  const inProgressToday = todayTokens.filter(t => t.status === 'CALLING' || t.status === 'IN_CONSULTATION').length;
  const waitingToday = todayTokens.filter(t => t.status === 'WAITING' || t.status === 'REFERRED').length;

  // Consultation Revenue
  const opdRevenue = todayTokens.reduce((sum, t) => sum + (t.fee || 0), 0);

  // Lab Revenue
  const completedLabOrders = (db.labOrders || []).filter(l => l.status === 'COMPLETED');
  const labRevenue = completedLabOrders.reduce((sum, l) => sum + (l.fee || 0), 0);

  // Pharmacy Revenue
  const pharmacyRevenue = (db.pharmacyInvoices || []).reduce((sum, inv) => sum + (inv.netTotal || 0), 0);

  const totalRevenue = opdRevenue + labRevenue + pharmacyRevenue;

  // Department distribution
  const deptMap = {};
  todayTokens.forEach(t => {
    const dept = t.departmentName || 'General';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  const departmentStats = Object.keys(deptMap).map(name => ({
    name,
    count: deptMap[name]
  }));

  // Doctor Workload
  const doctorWorkload = (db.doctors || []).map(doc => {
    const docTokens = todayTokens.filter(t => t.doctorId === doc.id);
    return {
      id: doc.id,
      name: doc.name,
      specialization: doc.specialization,
      roomNumber: doc.roomNumber,
      totalAssigned: docTokens.length,
      completed: docTokens.filter(t => t.status === 'COMPLETED').length,
      waiting: docTokens.filter(t => t.status === 'WAITING' || t.status === 'REFERRED').length
    };
  });

  // Recent Activity Log
  const activities = [];
  todayTokens.slice(-5).forEach(t => {
    activities.push({
      id: 'act-tok-' + t.id,
      time: t.createdAt,
      type: 'TOKEN',
      description: `Token #${t.tokenNumber} generated for ${t.patientName} (${t.doctorName})`
    });
  });

  (db.prescriptions || []).slice(-5).forEach(p => {
    activities.push({
      id: 'act-prsc-' + p.id,
      time: p.createdAt,
      type: 'PRESCRIPTION',
      description: `Prescription issued by ${p.doctorName} for ${p.patientName}`
    });
  });

  (db.pharmacyInvoices || []).slice(-5).forEach(inv => {
    activities.push({
      id: 'act-inv-' + inv.id,
      time: inv.createdAt,
      type: 'PHARMACY',
      description: `Invoice ${inv.invoiceNumber} (Rs. ${inv.netTotal}) dispensed for ${inv.patientName}`
    });
  });

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  res.json({
    success: true,
    stats: {
      totalPatientsToday,
      completedToday,
      inProgressToday,
      waitingToday,
      totalRegisteredPatients: (db.patients || []).length,
      activeDoctorsCount: (db.doctors || []).filter(d => d.isAvailable).length,
      totalRevenue,
      opdRevenue,
      labRevenue,
      pharmacyRevenue,
      pharmacyInvoicesCount: (db.pharmacyInvoices || []).length,
      labOrdersTotal: (db.labOrders || []).length,
      labOrdersCompleted: completedLabOrders.length,
      lowStockMedicines: (db.medicines || []).filter(m => m.stockQuantity <= m.reorderLevel).length
    },
    departmentStats,
    doctorWorkload,
    recentActivities: activities.slice(0, 10)
  });
});

export default router;
