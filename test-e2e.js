async function runTests() {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log("=== 1. Health Check ===");
  const health = await (await fetch(`${baseUrl}/health`)).json();
  console.log("Health:", health);

  console.log("\n=== 2. Hospital Info ===");
  const info = await (await fetch(`${baseUrl}/meta/hospital-info`)).json();
  console.log("Hospital Name:", info.hospitalInfo.name);

  console.log("\n=== 3. Generate Walk-in Token at Reception ===");
  const tokenRes = await (await fetch(`${baseUrl}/queue/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: 'Hamid Raza',
      patientPhone: '03001122334',
      patientAge: 38,
      patientGender: 'Male',
      departmentId: 'dept-cardio',
      doctorId: 'doc-1',
      priority: 'NORMAL',
      fee: 1500
    })
  })).json();
  console.log("Token Generated:", `#${tokenRes.token.tokenNumber}`, tokenRes.token.patientName, "Doctor:", tokenRes.token.doctorName);

  console.log("\n=== 4. Doctor Calls Patient & Issues Prescription ===");
  const callRes = await (await fetch(`${baseUrl}/queue/${tokenRes.token.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CALLING', doctorId: 'doc-1' })
  })).json();
  console.log("Status Updated to:", callRes.token.status);

  const prscRes = await (await fetch(`${baseUrl}/prescriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenId: tokenRes.token.id,
      patientId: tokenRes.token.patientId,
      patientName: 'Hamid Raza',
      patientAge: 38,
      patientGender: 'Male',
      doctorId: 'doc-1',
      doctorName: 'Dr. Imran Tahir',
      vitals: { bp: '130/85', pulse: '78', temp: '98.4', spo2: '98', weight: '74' },
      diagnosis: 'Essential Hypertension',
      medicines: [
        { name: 'Norvasc 5mg', dosage: '1 Tab', frequency: '1-0-0', duration: '14 Days', instructions: 'Morning' }
      ],
      labTests: [
        { testId: 'test-lipid', testName: 'Lipid Profile (Fasting)', priority: 'NORMAL' }
      ],
      followUpDate: '2026-09-05'
    })
  })).json();
  console.log("Prescription Created:", prscRes.prescription.id, "Lab Orders Created:", prscRes.labOrders.length);

  console.log("\n=== 5. Laboratory Portal Test Results Entry ===");
  const labOrderId = prscRes.labOrders[0].id;
  const labResultRes = await (await fetch(`${baseUrl}/lab/orders/${labOrderId}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parameters: [
        { name: 'Total Cholesterol', value: '195', unit: 'mg/dL', referenceRange: '< 200 Desirable', flag: 'NORMAL' },
        { name: 'Triglycerides', value: '160', unit: 'mg/dL', referenceRange: '< 150 Normal', flag: 'HIGH' },
        { name: 'HDL Cholesterol', value: '45', unit: 'mg/dL', referenceRange: '> 40', flag: 'NORMAL' },
        { name: 'LDL Cholesterol', value: '118', unit: 'mg/dL', referenceRange: '< 100', flag: 'HIGH' }
      ],
      technicianNotes: 'Fasting specimen analyzed on automated chemistry analyzer',
      pathologistRemarks: 'Borderline hypertriglyceridemia observed'
    })
  })).json();
  console.log("Lab Order Completed & Verified:", labResultRes.order.status, "Parameters count:", labResultRes.order.parameters.length);

  console.log("\n=== 6. Pharmacy Dispensing & Billing ===");
  const dispRes = await (await fetch(`${baseUrl}/pharmacy/dispense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prescriptionId: prscRes.prescription.id,
      patientName: 'Hamid Raza',
      items: [
        { brandName: 'Norvasc 5mg', quantity: 1, unitPrice: 16, instructions: 'Morning' }
      ],
      discountPercent: 10,
      taxPercent: 0,
      paymentMethod: 'CASH'
    })
  })).json();
  console.log("Dispensed Invoice:", dispRes.invoice.invoiceNumber, "Net Total: Rs.", dispRes.invoice.netTotal);

  console.log("\n=== 7. Online Appointment Booking ===");
  const aptRes = await (await fetch(`${baseUrl}/appointments/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: 'Sara Bibi',
      phone: '03219876543',
      departmentId: 'dept-gen-med',
      doctorId: 'doc-2',
      date: '2026-08-22',
      timeSlot: '10:00 AM - 10:30 AM',
      notes: 'Routine health checkup'
    })
  })).json();
  console.log("Online Appointment Confirmed:", aptRes.appointment.appointmentNumber, "Patient:", aptRes.appointment.patientName);

  console.log("\n=== 8. Hospital Executive Analytics Summary ===");
  const analyticsRes = await (await fetch(`${baseUrl}/analytics/overview`)).json();
  console.log("Total Revenue Today: Rs.", analyticsRes.stats.totalRevenue);
  console.log("OPD Revenue: Rs.", analyticsRes.stats.opdRevenue);
  console.log("Lab Revenue: Rs.", analyticsRes.stats.labRevenue);
  console.log("Pharmacy Revenue: Rs.", analyticsRes.stats.pharmacyRevenue);
  console.log("Total Patients Registered Today:", analyticsRes.stats.totalPatientsToday);

  console.log("\n==========================================");
  console.log(" ALL SYSTEM MODULES TESTED & OPERATIONAL! ");
  console.log("==========================================");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
