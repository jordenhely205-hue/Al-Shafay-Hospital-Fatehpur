import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

import PublicBooking from './pages/PublicBooking';
import StaffLogin from './pages/StaffLogin';
import Unauthorized from './pages/Unauthorized';

import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import WaitingRoomScreen from './pages/WaitingRoomScreen';
import LaboratoryPortal from './pages/LaboratoryPortal';
import PharmacyPortal from './pages/PharmacyPortal';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Routes>
      
      {/* 1. Public Facing Pages (Hospital Landing, Online Booking, Appointment Tracker, Staff Login) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicBooking />} />
        <Route path="/book" element={<PublicBooking />} />
        <Route path="/track" element={<PublicBooking />} />
        <Route path="/login" element={<StaffLogin />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* 2. Full-Screen Waiting TV Monitor (Zero sidebar/header for TV monitors) */}
      <Route path="/screen" element={<WaitingRoomScreen />} />

      {/* 3. Protected Staff Application Shell (AppLayout with Collapsible Left Sidebar) */}
      <Route element={<AppLayout />}>
        
        {/* Reception Desk: RECEPTIONIST & ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['receptionist', 'super_admin']} />}>
          <Route path="/reception" element={<ReceptionDashboard />} />
        </Route>

        {/* Doctor Portal: DOCTOR & ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['doctor', 'super_admin']} />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
        </Route>

        {/* Laboratory Dashboard: LAB_TECH & ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['lab_tech', 'super_admin']} />}>
          <Route path="/lab" element={<LaboratoryPortal />} />
        </Route>

        {/* Pharmacy POS: PHARMACIST & ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['pharmacist', 'super_admin']} />}>
          <Route path="/pharmacy" element={<PharmacyPortal />} />
        </Route>

        {/* Executive Admin Analytics: SUPER ADMIN ONLY */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
