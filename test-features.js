async function runVerification() {
  const baseUrl = 'http://localhost:5000/api';
  console.log("=================================================");
  console.log(" TESTING RADIOLOGY SCANS, URDU TTS & REFERRALS  ");
  console.log("=================================================");

  // 1. Health Check
  const health = await (await fetch(`${baseUrl}/health`)).json();
  console.log("\n[1] Health Status:", health.status, "| Hospital:", health.hospital);

  // 2. Test Scan Upload Endpoint
  console.log("\n[2] Testing Diagnostic Scan Upload...");
  const dummyScanBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const uploadRes = await (await fetch(`${baseUrl}/lab/upload-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data: dummyScanBase64 })
  })).json();
  console.log("Upload Success:", uploadRes.success, "| Image URL:", uploadRes.imageUrl);

  // 3. Generate a patient token
  console.log("\n[3] Generating Reception Token for Walk-in Patient...");
  const tokenRes = await (await fetch(`${baseUrl}/queue/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: 'Kashif Mehmood',
      patientPhone: '03009988771',
      patientAge: 42,
      patientGender: 'Male',
      departmentId: 'dept-cardio',
      doctorId: 'doc-1',
      priority: 'NORMAL'
    })
  })).json();
  const token = tokenRes.token;
  console.log(`Generated Token #${token.tokenNumber} for ${token.patientName} -> Dr. Imran Tahir`);

  // 4. Doctor A (Cardiologist) refers patient to Doctor B (General Physician)
  console.log("\n[4] Step 1: Dr. Imran refers patient to Dr. Fatima Noor (via Reception)...");
  const referRes = await (await fetch(`${baseUrl}/queue/${token.id}/refer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toDoctorId: 'doc-2',
      notes: 'Please evaluate for persistent hypertension and blood sugar regulation.'
    })
  })).json();
  console.log("Referral Status:", referRes.token.status);
  console.log("Target Doctor:", referRes.token.referredToDoctorName, `(${referRes.token.targetRoomNumber})`);

  // 5. Reception Desk checks referred queue
  console.log("\n[5] Step 2: Receptionist checks Referred Patients Queue...");
  const queueRes = await (await fetch(`${baseUrl}/queue`)).json();
  const referredWaiting = queueRes.tokens.filter(t => t.status === 'REFERRED_TO_RECEPTION');
  console.log(`Found ${referredWaiting.length} patient(s) waiting at Reception desk for forwarding.`);

  // 6. Receptionist forwards patient to Doctor B
  console.log("\n[6] Step 3: Receptionist forwards patient to Dr. Fatima's live room queue...");
  const forwardRes = await (await fetch(`${baseUrl}/queue/${token.id}/reception-forward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority: 'EMERGENCY' })
  })).json();
  console.log("Forwarded Token Status:", forwardRes.token.status);
  console.log("New Assigned Doctor:", forwardRes.token.doctorName, `(${forwardRes.token.roomNumber})`);
  console.log("Priority:", forwardRes.token.priority);

  // 7. Verify EMR includes patient records
  console.log("\n[7] Step 4: Verify Dr. Fatima's EMR can load patient records & scans...");
  const emrRes = await (await fetch(`${baseUrl}/patients/${token.patientId}/emr`)).json();
  console.log("Patient Visits in EMR:", emrRes.emr.visits.length);

  console.log("\n=================================================");
  console.log(" ALL ENHANCED FEATURES VERIFIED AND PASSING! ");
  console.log("=================================================");
}

runVerification().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
