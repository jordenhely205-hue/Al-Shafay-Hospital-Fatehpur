# Al-Shafay Hospital Fatehpur - Hospital Management & Queue System (HMS)

A complete, responsive, full-stack Hospital Management & Queue System built for **Al-Shafay Hospital Fatehpur**, featuring real-time multi-department data synchronization, role-based dashboards, automated audio announcements (TTS + Chimes), digital EMR, laboratory portal, and pharmacy inventory/billing.

---

## 🌟 Key Features

### 1. 🏥 Prominent Branding & Architecture
- **Hospital Title**: Bold and prominent **"Al-Shafay Hospital Fatehpur"** featured across all UI headers, public screens, 80mm thermal receipts, and A4 medical reports.
- **Top Quick Role Switcher**: One-click instant testing for all hospital staff roles (Receptionist, Dr. Imran Tahir, Dr. Fatima Noor, Lab Technologist, Pharmacist, Super Admin, Waiting Room TV, Public Booking).
- **Real-Time Data Sync**: WebSocket event engine connecting reception, doctor desks, lab, pharmacy, and TV screens with live status indicators.

### 2. 🌐 Public Portal & Online Booking
- **Self-Service Online Booking**: Patients can select Department, Doctor, Date, and preferred Time Slot.
- **Live Status Tracker**: Search appointment status by Mobile Number or Appointment ID (`APT-XXXX`).
- **Emergency Hotline & Doctor Schedules**.

### 3. 🎫 Reception Dashboard (Token Generation & Front Desk)
- **Walk-in Patient Registration**: Name, Phone, CNIC, Age, Gender, Department, Doctor, Priority (Normal / Emergency / Elderly).
- **Sequential Daily Token Generator**: Auto-incrementing daily tokens (`#101`, `#102`, etc.).
- **Printable Thermal Slip (80mm Parchi)**: Features Hospital Name, Token #, Patient Demographics, Doctor & Room #, Date/Time, and Next Follow-up Checkup Date placeholder.
- **Real-time Forwarding**: One-click forwarding to doctor queue with instant notification.
- **Centralized Lab Reports Center**: Search, view, and print completed official diagnostic test reports.

### 4. 📺 Waiting Area Live TV Queue Screen & Audio Announcements
- **Full-Screen TV Display**: High-contrast, clean visual monitor displaying current token calling banner, doctor, and room number.
- **Automated Voice Announcements**: Web Speech API (`speechSynthesis`) + Web Audio tone chime announces:
  > *"Token number 14, Mr. Ahmed Ali, please proceed to Doctor Imran Tahir, Room 101."*
- **Queue Ticker**: Live list of "Next in Line" and "Currently in Consultation".
- **Audio Controls**: Mute/unmute toggle, voice tester, repeat call trigger, and fullscreen mode.

### 5. 🩺 Doctor Dashboard (EMR & Prescriptions)
- **Live Patient Queue Feed**: Real-time arrival notifications.
- **Call Patient Trigger**: Broadcasts token call to Waiting Screen & Audio TTS.
- **Electronic Medical Records (EMR)**: Vital signs (BP, Pulse, Temp, SpO2, Weight), Chief Complaints, Diagnosis, Past medical visits, and historical lab reports.
- **Digital Prescription Builder**: Autocomplete medicine search from pharmacy inventory, Dosage, Frequency (`1-0-1`, `1-1-1`), Duration, Usage instructions.
- **Diagnostic Lab Requisition**: Order tests directly (CBC, LFT, RFT, Lipid Profile, Blood Sugar, Urine RE, X-Ray, ECG) with auto-dispatch to Lab.
- **Doctor-to-Doctor Referral**: Transfer patient file with handover notes.
- **Follow-up Date**: Set next checkup date (persisted to Reception and Pharmacy slips).
- **A4 Prescription Print**: Formatted prescription pad with hospital header.

### 6. 🔬 Diagnostic Laboratory Portal
- **Incoming Test Requisitions Feed**: Real-time stream of tests ordered by doctors.
- **Sample Tracking**: `Pending` ➔ `Sample Collected` ➔ `In Progress` ➔ `Completed`.
- **Result Entry Form**: Structured parameter entry with units, biological reference intervals, and auto High/Low/Normal flagging.
- **Official A4 Lab Report**: Pathologist verification, accreditation signatures, and print preview.

### 7. 💊 Pharmacy / Medical Store Portal
- **Prescription Sync Inbox**: Real-time feed of finalized doctor prescriptions.
- **Medicine Inventory & Stock**: Track batch numbers, expiry dates, unit prices, reorder levels, and low-stock alerts.
- **Dispensing & POS Checkout**: Calculate itemized totals, apply discounts, select payment method (Cash / Card / Online), deduct stock quantity, and mark as dispensed.
- **Printable Invoices**: Dedicated 80mm thermal receipt & A4 invoice formats.

### 8. 📊 Executive Admin & Hospital Analytics
- **Financial & Operational Analytics**: Total revenue today (OPD consultation fees + Diagnostic lab fees + Pharmacy sales).
- **Doctor Workload & Department Footfall Breakdown**.
- **Real-Time Audit Trail**: Activity log of tokens, prescriptions, and invoices.
- **Doctor & Department Management**: Add new doctors, assign room numbers, set consultation fees and schedules.

---

## 🚀 Quick Start & Running

### Prerequisites
- Node.js (v18+)

### Start the Application

1. **Start Backend & Frontend together**:
   ```bash
   node server/server.js
   ```
   Open **http://localhost:5000** in your browser.

2. **Or run Vite in development mode**:
   ```bash
   # Terminal 1: Backend
   node server/server.js

   # Terminal 2: Frontend (Vite)
   cd client
   npm run dev
   ```
   Open **http://localhost:3000** in your browser.

---

## 🔐 Default Demo Accounts

| Role | Username | Password | Doctor / Dept |
|---|---|---|---|
| **Receptionist** | `reception` | `reception123` | Reception Desk |
| **Cardiologist** | `dr.imran` | `doctor123` | Dr. Imran Tahir (Room 101) |
| **General Physician** | `dr.fatima` | `doctor123` | Dr. Fatima Noor (Room 102) |
| **Pediatrician** | `dr.tariq` | `doctor123` | Dr. Tariq Mahmood (Room 103) |
| **Gynecologist** | `dr.ayesha` | `doctor123` | Dr. Ayesha Siddiqa (Room 104) |
| **Lab Technologist** | `labtech` | `lab123` | Diagnostic Laboratory |
| **Pharmacist** | `pharmacist` | `pharmacy123` | Pharmacy & Medical Store |
| **Super Admin** | `admin` | `admin123` | Hospital Medical Director |

*(Note: You can also use the **Quick Role Switcher** bar at the top of the screen to switch roles instantly with one click.)*

---

## 🖨️ Dedicated Print Optimizations
- **80mm Thermal Slip / Receipt**: Optimized `@media print` layout for Reception token parchi and Pharmacy dispensing receipts.
- **A4 Medical Documents**: High-resolution print styling for Doctor electronic prescriptions and verified Diagnostic Laboratory reports.
