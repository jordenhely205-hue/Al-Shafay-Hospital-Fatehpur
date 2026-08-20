import bcrypt from 'bcryptjs';
import { getDb, saveDatabase } from './db.js';

export async function seedDatabase(force = false) {
  const db = getDb();
  if (!force && db.users && db.users.length > 0) {
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPass = (pw) => bcrypt.hashSync(pw, salt);

  const departments = [
    { id: 'dept-gen-med', name: 'General Medicine', code: 'GM', description: 'Internal medicine, fever, infectious diseases, chronic illness' },
    { id: 'dept-cardio', name: 'Cardiology', code: 'CARD', description: 'Heart diseases, hypertension, ECG & echocardiography' },
    { id: 'dept-peds', name: 'Pediatrics & Child Care', code: 'PED', description: 'Neonatal care, child development, vaccinations' },
    { id: 'dept-gyn', name: 'Gynecology & Obstetrics', code: 'GYN', description: 'Maternal health, prenatal care, women health' },
    { id: 'dept-ortho', name: 'Orthopedics', code: 'ORTH', description: 'Bone fractures, joints, arthritis, spine disorders' },
    { id: 'dept-eye', name: 'Ophthalmology (Eye)', code: 'EYE', description: 'Vision care, cataract, eye checkup' },
    { id: 'dept-ent', name: 'ENT (Ear, Nose, Throat)', code: 'ENT', description: 'Sinus, hearing, throat ailments' },
    { id: 'dept-surg', name: 'General Surgery', code: 'SURG', description: 'Minor and major surgical consultations & procedures' },
    { id: 'dept-lab', name: 'Diagnostic Laboratory', code: 'LAB', description: 'Pathology, hematology, biochemistry, microbiology' },
    { id: 'dept-pharm', name: 'Pharmacy & Medical Store', code: 'PHARM', description: 'Prescription dispensing, surgical items, healthcare products' }
  ];

  const doctors = [
    {
      id: 'doc-1',
      name: 'Dr. Imran Tahir',
      qualification: 'MBBS, FCPS (Cardiology)',
      departmentId: 'dept-cardio',
      departmentName: 'Cardiology',
      specialization: 'Consultant Cardiologist & Heart Specialist',
      roomNumber: 'Room 101',
      consultationFee: 1500,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timing: '09:00 AM - 02:00 PM',
      phone: '+92 301 1112221',
      isAvailable: true
    },
    {
      id: 'doc-2',
      name: 'Dr. Fatima Noor',
      qualification: 'MBBS, FCPS (Medicine), MRCP',
      departmentId: 'dept-gen-med',
      departmentName: 'General Medicine',
      specialization: 'Senior Physician & Diabetologist',
      roomNumber: 'Room 102',
      consultationFee: 1200,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timing: '10:00 AM - 04:00 PM',
      phone: '+92 302 2223332',
      isAvailable: true
    },
    {
      id: 'doc-3',
      name: 'Dr. Tariq Mahmood',
      qualification: 'MBBS, DCH, MCPS (Pediatrics)',
      departmentId: 'dept-peds',
      departmentName: 'Pediatrics & Child Care',
      specialization: 'Child Specialist & Neonatologist',
      roomNumber: 'Room 103',
      consultationFee: 1000,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timing: '11:00 AM - 05:00 PM',
      phone: '+92 303 3334443',
      isAvailable: true
    },
    {
      id: 'doc-4',
      name: 'Dr. Ayesha Siddiqa',
      qualification: 'MBBS, FCPS (Gynecology & Obstetrics)',
      departmentId: 'dept-gyn',
      departmentName: 'Gynecology & Obstetrics',
      specialization: 'Consultant Gynecologist & Infertility Specialist',
      roomNumber: 'Room 104',
      consultationFee: 1500,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timing: '09:00 AM - 03:00 PM',
      phone: '+92 304 4445554',
      isAvailable: true
    },
    {
      id: 'doc-5',
      name: 'Dr. Zulfiqar Ali',
      qualification: 'MBBS, MS (Orthopedics)',
      departmentId: 'dept-ortho',
      departmentName: 'Orthopedics',
      specialization: 'Consultant Orthopedic Surgeon',
      roomNumber: 'Room 105',
      consultationFee: 1400,
      days: ['Mon', 'Wed', 'Fri', 'Sat'],
      timing: '02:00 PM - 07:00 PM',
      phone: '+92 305 5556665',
      isAvailable: true
    }
  ];

  const users = [
    {
      id: 'usr-admin',
      username: 'admin',
      password: hashPass('admin123'),
      name: 'Dr. Shafay (Medical Director)',
      role: 'super_admin',
      department: 'Administration',
      email: 'director@alshafayhospital.com'
    },
    {
      id: 'usr-rec',
      username: 'reception',
      password: hashPass('reception123'),
      name: 'Muhammad Aslam',
      role: 'receptionist',
      department: 'Reception & Registration',
      email: 'reception@alshafayhospital.com'
    },
    {
      id: 'usr-doc-1',
      username: 'dr.imran',
      password: hashPass('doctor123'),
      name: 'Dr. Imran Tahir',
      role: 'doctor',
      doctorId: 'doc-1',
      department: 'Cardiology',
      email: 'dr.imran@alshafayhospital.com'
    },
    {
      id: 'usr-doc-2',
      username: 'dr.fatima',
      password: hashPass('doctor123'),
      name: 'Dr. Fatima Noor',
      role: 'doctor',
      doctorId: 'doc-2',
      department: 'General Medicine',
      email: 'dr.fatima@alshafayhospital.com'
    },
    {
      id: 'usr-doc-3',
      username: 'dr.tariq',
      password: hashPass('doctor123'),
      name: 'Dr. Tariq Mahmood',
      role: 'doctor',
      doctorId: 'doc-3',
      department: 'Pediatrics & Child Care',
      email: 'dr.tariq@alshafayhospital.com'
    },
    {
      id: 'usr-doc-4',
      username: 'dr.ayesha',
      password: hashPass('doctor123'),
      name: 'Dr. Ayesha Siddiqa',
      role: 'doctor',
      doctorId: 'doc-4',
      department: 'Gynecology & Obstetrics',
      email: 'dr.ayesha@alshafayhospital.com'
    },
    {
      id: 'usr-lab',
      username: 'labtech',
      password: hashPass('lab123'),
      name: 'Kashif Rasheed (Senior Lab Technologist)',
      role: 'lab_tech',
      department: 'Diagnostic Laboratory',
      email: 'lab@alshafayhospital.com'
    },
    {
      id: 'usr-pharm',
      username: 'pharmacist',
      password: hashPass('pharmacy123'),
      name: 'Hamza Bilal (R.Ph)',
      role: 'pharmacist',
      department: 'Pharmacy & Medical Store',
      email: 'pharmacy@alshafayhospital.com'
    }
  ];

  const labTestCatalog = [
    {
      id: 'test-cbc',
      name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      fee: 850,
      specimen: 'Whole Blood (EDTA)',
      turnaround: '2 Hours',
      parameters: [
        { name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '13.5 - 17.5 (M), 12.0 - 15.5 (F)', defaultValue: '14.2' },
        { name: 'Total Leukocyte Count (TLC / WBC)', unit: '/mcL', referenceRange: '4,000 - 11,000', defaultValue: '7,400' },
        { name: 'Platelets Count', unit: '/mcL', referenceRange: '150,000 - 450,000', defaultValue: '260,000' },
        { name: 'RBC Count', unit: 'million/mcL', referenceRange: '4.5 - 5.9 (M), 4.1 - 5.1 (F)', defaultValue: '4.8' },
        { name: 'Hematocrit (HCT / PCV)', unit: '%', referenceRange: '41 - 50 (M), 36 - 44 (F)', defaultValue: '42.5' },
        { name: 'Neutrophils', unit: '%', referenceRange: '50 - 70', defaultValue: '62' },
        { name: 'Lymphocytes', unit: '%', referenceRange: '20 - 40', defaultValue: '30' },
        { name: 'Eosinophils', unit: '%', referenceRange: '1 - 6', defaultValue: '3' },
        { name: 'ESR (Westergren)', unit: 'mm/1st hr', referenceRange: '0 - 15 (M), 0 - 20 (F)', defaultValue: '12' }
      ]
    },
    {
      id: 'test-lft',
      name: 'Liver Function Tests (LFT)',
      category: 'Clinical Biochemistry',
      fee: 1400,
      specimen: 'Serum (Plain/Gel Tube)',
      turnaround: '3 Hours',
      parameters: [
        { name: 'Bilirubin Total', unit: 'mg/dL', referenceRange: '0.2 - 1.2', defaultValue: '0.8' },
        { name: 'Bilirubin Direct', unit: 'mg/dL', referenceRange: '0.0 - 0.3', defaultValue: '0.2' },
        { name: 'SGPT / ALT', unit: 'U/L', referenceRange: '7 - 56', defaultValue: '34' },
        { name: 'SGOT / AST', unit: 'U/L', referenceRange: '10 - 40', defaultValue: '28' },
        { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', referenceRange: '44 - 147', defaultValue: '95' },
        { name: 'Total Protein', unit: 'g/dL', referenceRange: '6.0 - 8.3', defaultValue: '7.1' },
        { name: 'Serum Albumin', unit: 'g/dL', referenceRange: '3.5 - 5.0', defaultValue: '4.3' }
      ]
    },
    {
      id: 'test-rft',
      name: 'Renal Function Tests (RFT / Kidney Profile)',
      category: 'Clinical Biochemistry',
      fee: 1100,
      specimen: 'Serum (Plain/Gel Tube)',
      turnaround: '2 Hours',
      parameters: [
        { name: 'Blood Urea', unit: 'mg/dL', referenceRange: '15 - 45', defaultValue: '28' },
        { name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.6 - 1.2 (M), 0.5 - 1.1 (F)', defaultValue: '0.9' },
        { name: 'Serum Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2 (M), 2.6 - 6.0 (F)', defaultValue: '5.2' },
        { name: 'Sodium (Na+)', unit: 'mEq/L', referenceRange: '135 - 145', defaultValue: '140' },
        { name: 'Potassium (K+)', unit: 'mEq/L', referenceRange: '3.5 - 5.0', defaultValue: '4.2' }
      ]
    },
    {
      id: 'test-lipid',
      name: 'Lipid Profile (Fasting)',
      category: 'Clinical Biochemistry',
      fee: 1600,
      specimen: 'Serum (Fasting 12h)',
      turnaround: '4 Hours',
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200 Desirable', defaultValue: '185' },
        { name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150 Normal', defaultValue: '142' },
        { name: 'HDL Cholesterol (Good)', unit: 'mg/dL', referenceRange: '> 40 (M), > 50 (F)', defaultValue: '48' },
        { name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', referenceRange: '< 100 Optimal', defaultValue: '108' }
      ]
    },
    {
      id: 'test-bsr',
      name: 'Blood Glucose (Random / Fasting)',
      category: 'Clinical Biochemistry',
      fee: 250,
      specimen: 'Fluoride / Serum',
      turnaround: '30 Minutes',
      parameters: [
        { name: 'Blood Sugar Level', unit: 'mg/dL', referenceRange: 'Fasting: 70-100, Random: < 140', defaultValue: '110' }
      ]
    },
    {
      id: 'test-hba1c',
      name: 'Glycated Hemoglobin (HbA1c)',
      category: 'Clinical Biochemistry',
      fee: 1500,
      specimen: 'Whole Blood (EDTA)',
      turnaround: '3 Hours',
      parameters: [
        { name: 'HbA1c Level', unit: '%', referenceRange: 'Normal: <5.7, Pre-diabetic: 5.7-6.4, Diabetic: >=6.5', defaultValue: '6.1' }
      ]
    },
    {
      id: 'test-urine',
      name: 'Urine Routine Examination (Urine R/E)',
      category: 'Clinical Pathology',
      fee: 450,
      specimen: 'Clean Catch Midstream Urine',
      turnaround: '1 Hour',
      parameters: [
        { name: 'Color / Appearance', unit: '', referenceRange: 'Pale Yellow / Clear', defaultValue: 'Straw / Clear' },
        { name: 'pH', unit: '', referenceRange: '4.6 - 8.0', defaultValue: '6.0' },
        { name: 'Specific Gravity', unit: '', referenceRange: '1.005 - 1.030', defaultValue: '1.015' },
        { name: 'Protein / Albumin', unit: '', referenceRange: 'Nil / Negative', defaultValue: 'Nil' },
        { name: 'Glucose / Sugar', unit: '', referenceRange: 'Nil / Negative', defaultValue: 'Nil' },
        { name: 'Pus Cells (WBC)', unit: '/HPF', referenceRange: '0 - 5', defaultValue: '1 - 2' },
        { name: 'Red Blood Cells (RBC)', unit: '/HPF', referenceRange: '0 - 2', defaultValue: 'Nil' },
        { name: 'Epithelial Cells', unit: '/HPF', referenceRange: 'Few', defaultValue: 'Few' }
      ]
    },
    {
      id: 'test-xray',
      name: 'Digital Chest X-Ray (PA View)',
      category: 'Radiology & Imaging',
      fee: 900,
      specimen: 'Radiological Scan',
      turnaround: '30 Minutes',
      parameters: [
        { name: 'Lung Fields', unit: '', referenceRange: 'Clear bilateral lung fields', defaultValue: 'Clear, no active infiltrates' },
        { name: 'Cardiac Silhouette (CTR)', unit: '', referenceRange: 'Normal size (<50%)', defaultValue: 'Normal cardio-thoracic ratio' },
        { name: 'Costophrenic Angles', unit: '', referenceRange: 'Sharp & Clear', defaultValue: 'Both CP angles clear' }
      ]
    },
    {
      id: 'test-ecg',
      name: '12-Lead Electrocardiogram (ECG)',
      category: 'Cardiology Diagnostics',
      fee: 600,
      specimen: 'Electrophysiological Tracing',
      turnaround: 'Immediate',
      parameters: [
        { name: 'Heart Rate & Rhythm', unit: 'BPM', referenceRange: '60 - 100 Normal Sinus', defaultValue: '76 BPM, Normal Sinus Rhythm' },
        { name: 'PR & QRS Intervals', unit: 'ms', referenceRange: 'Normal Axis & Conductance', defaultValue: 'Normal Axis, no acute ST-T changes' }
      ]
    }
  ];

  const medicines = [
    {
      id: 'med-1',
      brandName: 'Panadol 500mg',
      genericName: 'Paracetamol',
      category: 'Analgesics & Antipyretics',
      dosageForm: 'Tablet',
      strength: '500mg',
      unitPrice: 4.5,
      costPrice: 3.2,
      stockQuantity: 450,
      reorderLevel: 100,
      batchNumber: 'PND-2026-08',
      expiryDate: '2027-11-30',
      manufacturer: 'GSK Pakistan',
      locationShelf: 'Shelf A-1'
    },
    {
      id: 'med-2',
      brandName: 'Augmentin 625mg',
      genericName: 'Co-Amoxiclav (Amoxicillin + Clavulanic Acid)',
      category: 'Antibiotics',
      dosageForm: 'Tablet',
      strength: '625mg',
      unitPrice: 42.0,
      costPrice: 34.0,
      stockQuantity: 180,
      reorderLevel: 50,
      batchNumber: 'AUG-9912',
      expiryDate: '2027-08-15',
      manufacturer: 'GSK Pakistan',
      locationShelf: 'Shelf B-2'
    },
    {
      id: 'med-3',
      brandName: 'Risek 40mg',
      genericName: 'Omeprazole',
      category: 'Gastrointestinal & Anti-Ulcerant',
      dosageForm: 'Capsule',
      strength: '40mg',
      unitPrice: 38.0,
      costPrice: 29.0,
      stockQuantity: 220,
      reorderLevel: 40,
      batchNumber: 'RSK-4401',
      expiryDate: '2028-01-20',
      manufacturer: 'Getz Pharma',
      locationShelf: 'Shelf A-4'
    },
    {
      id: 'med-4',
      brandName: 'Brufen 400mg',
      genericName: 'Ibuprofen',
      category: 'NSAIDs & Pain Relief',
      dosageForm: 'Tablet',
      strength: '400mg',
      unitPrice: 6.0,
      costPrice: 4.5,
      stockQuantity: 300,
      reorderLevel: 80,
      batchNumber: 'BRF-7782',
      expiryDate: '2027-09-10',
      manufacturer: 'Abbott Laboratories',
      locationShelf: 'Shelf A-2'
    },
    {
      id: 'med-5',
      brandName: 'Glucophage 500mg',
      genericName: 'Metformin HCl',
      category: 'Anti-Diabetic',
      dosageForm: 'Tablet',
      strength: '500mg',
      unitPrice: 8.5,
      costPrice: 6.5,
      stockQuantity: 350,
      reorderLevel: 60,
      batchNumber: 'GLC-1002',
      expiryDate: '2028-04-12',
      manufacturer: 'Merck Serono',
      locationShelf: 'Shelf C-1'
    },
    {
      id: 'med-6',
      brandName: 'Norvasc 5mg',
      genericName: 'Amlodipine Besylate',
      category: 'Cardiovascular & Anti-Hypertensive',
      dosageForm: 'Tablet',
      strength: '5mg',
      unitPrice: 16.0,
      costPrice: 12.0,
      stockQuantity: 240,
      reorderLevel: 50,
      batchNumber: 'NRV-3011',
      expiryDate: '2027-12-05',
      manufacturer: 'Pfizer Pakistan',
      locationShelf: 'Shelf C-3'
    },
    {
      id: 'med-7',
      brandName: 'Flagyl 400mg',
      genericName: 'Metronidazole',
      category: 'Antiprotozoal & Antibacterial',
      dosageForm: 'Tablet',
      strength: '400mg',
      unitPrice: 5.0,
      costPrice: 3.8,
      stockQuantity: 260,
      reorderLevel: 60,
      batchNumber: 'FLG-8802',
      expiryDate: '2027-10-25',
      manufacturer: 'Sanofi Aventis',
      locationShelf: 'Shelf B-1'
    },
    {
      id: 'med-8',
      brandName: 'Azomax 500mg',
      genericName: 'Azithromycin',
      category: 'Macrolide Antibiotics',
      dosageForm: 'Capsule',
      strength: '500mg',
      unitPrice: 65.0,
      costPrice: 52.0,
      stockQuantity: 120,
      reorderLevel: 30,
      batchNumber: 'AZX-4911',
      expiryDate: '2028-02-18',
      manufacturer: 'Getz Pharma',
      locationShelf: 'Shelf B-3'
    },
    {
      id: 'med-9',
      brandName: 'Surbex-Z',
      genericName: 'Zinc + B-Complex + Vitamin C & E',
      category: 'Multivitamins & Minerals',
      dosageForm: 'Tablet',
      strength: 'Standard Formula',
      unitPrice: 18.0,
      costPrice: 14.5,
      stockQuantity: 190,
      reorderLevel: 40,
      batchNumber: 'SBZ-9022',
      expiryDate: '2028-06-30',
      manufacturer: 'Abbott Laboratories',
      locationShelf: 'Shelf D-1'
    },
    {
      id: 'med-10',
      brandName: 'Ventolin Inhaler 100mcg',
      genericName: 'Salbutamol Inhaler',
      category: 'Respiratory & Bronchodilator',
      dosageForm: 'Inhaler',
      strength: '200 Doses',
      unitPrice: 420.0,
      costPrice: 350.0,
      stockQuantity: 45,
      reorderLevel: 15,
      batchNumber: 'VNT-6612',
      expiryDate: '2027-05-15',
      manufacturer: 'GSK Pakistan',
      locationShelf: 'Shelf D-3'
    }
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const patients = [
    {
      id: 'pat-1',
      mrn: 'MRN-2026-001',
      name: 'Muhammad Tariq',
      phone: '03007891234',
      cnic: '32203-1234567-1',
      age: 48,
      gender: 'Male',
      bloodGroup: 'B+',
      address: 'Ward No. 4, Fatehpur, Layyah',
      createdAt: `${todayStr}T08:30:00Z`
    },
    {
      id: 'pat-2',
      mrn: 'MRN-2026-002',
      name: 'Zainab Bibi',
      phone: '03129876543',
      cnic: '32203-7654321-2',
      age: 34,
      gender: 'Female',
      bloodGroup: 'O+',
      address: 'Chak 217 TDA, Fatehpur',
      createdAt: `${todayStr}T09:00:00Z`
    },
    {
      id: 'pat-3',
      mrn: 'MRN-2026-003',
      name: 'Ali Raza',
      phone: '03334567890',
      cnic: '32203-9988776-3',
      age: 8,
      gender: 'Male',
      bloodGroup: 'A+',
      address: 'Main Bazaar, Fatehpur',
      createdAt: `${todayStr}T09:30:00Z`
    }
  ];

  const tokens = [
    {
      id: 'tok-1',
      tokenNumber: 101,
      date: todayStr,
      patientId: 'pat-1',
      patientName: 'Muhammad Tariq',
      patientPhone: '03007891234',
      patientAge: 48,
      patientGender: 'Male',
      departmentId: 'dept-cardio',
      departmentName: 'Cardiology',
      doctorId: 'doc-1',
      doctorName: 'Dr. Imran Tahir',
      roomNumber: 'Room 101',
      priority: 'NORMAL',
      status: 'CALLING',
      fee: 1500,
      createdAt: `${todayStr}T08:45:00Z`,
      calledAt: `${todayStr}T09:10:00Z`
    },
    {
      id: 'tok-2',
      tokenNumber: 102,
      date: todayStr,
      patientId: 'pat-2',
      patientName: 'Zainab Bibi',
      patientPhone: '03129876543',
      patientAge: 34,
      patientGender: 'Female',
      departmentId: 'dept-gen-med',
      departmentName: 'General Medicine',
      doctorId: 'doc-2',
      doctorName: 'Dr. Fatima Noor',
      roomNumber: 'Room 102',
      priority: 'NORMAL',
      status: 'WAITING',
      fee: 1200,
      createdAt: `${todayStr}T09:15:00Z`
    },
    {
      id: 'tok-3',
      tokenNumber: 103,
      date: todayStr,
      patientId: 'pat-3',
      patientName: 'Ali Raza',
      patientPhone: '03334567890',
      patientAge: 8,
      patientGender: 'Male',
      departmentId: 'dept-peds',
      departmentName: 'Pediatrics & Child Care',
      doctorId: 'doc-3',
      doctorName: 'Dr. Tariq Mahmood',
      roomNumber: 'Room 103',
      priority: 'NORMAL',
      status: 'WAITING',
      fee: 1000,
      createdAt: `${todayStr}T09:35:00Z`
    }
  ];

  const prescriptions = [];
  const labOrders = [];
  const pharmacyInvoices = [];
  const appointments = [
    {
      id: 'apt-1',
      appointmentNumber: 'APT-1001',
      patientName: 'Khurram Shehzad',
      phone: '03045551234',
      cnic: '32203-5554443-1',
      departmentId: 'dept-cardio',
      departmentName: 'Cardiology',
      doctorId: 'doc-1',
      doctorName: 'Dr. Imran Tahir',
      date: todayStr,
      timeSlot: '11:30 AM',
      status: 'CONFIRMED',
      notes: 'Routine chest tightness checkup',
      createdAt: `${todayStr}T07:15:00Z`
    }
  ];

  db.users = users;
  db.departments = departments;
  db.doctors = doctors;
  db.patients = patients;
  db.tokens = tokens;
  db.appointments = appointments;
  db.prescriptions = prescriptions;
  db.labOrders = labOrders;
  db.labTestCatalog = labTestCatalog;
  db.medicines = medicines;
  db.pharmacyInvoices = pharmacyInvoices;

  saveDatabase(db);
  console.log("Database initialized and pre-seeded successfully.");
}
