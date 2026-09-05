import React from 'react';
import { MapPin, Phone, MessageCircle, ShieldCheck, HeartPulse } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-8 px-4 text-xs text-slate-500 no-print space-y-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div className="flex items-center gap-3">
          <div className="logo-3d-wrapper">
            <img src="/logo.png" alt="Al-Shafay Hospital Logo" className="h-8 w-8 object-contain opacity-95 shrink-0" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800 text-sm">
              Al-Shafay Hospital <span className="text-[#0B4F9C]">Fatehpur</span> • <span className="font-urdu font-bold text-slate-900">الشافع ہسپتال فتح پور</span>
            </p>
            <p className="text-[11px] text-slate-500">Official Electronic Medical Records & Outpatient Management</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 text-slate-600 font-medium text-[11px]">
          <span className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-600" /> Hospital Road, Fatehpur, Layyah</span>
          <span className="flex items-center gap-1.5"><Phone size={13} className="text-[#0B4F9C]" /> 24/7 Helpline: 0300-1234567</span>
          <a href="https://api.whatsapp.com/send?phone=923016167412" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-700 font-bold hover:underline">
            <MessageCircle size={13} className="text-emerald-600" />
            <span>WhatsApp: 0301-6167412</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2">
        <p>© {new Date().getFullYear()} Al-Shafay Hospital Fatehpur (الشافع ہسپتال فتح پور). All rights reserved.</p>
        <p className="font-mono text-slate-700 font-bold">Website Developed By : AM FutureStack 03069141212</p>
        <p className="font-mono">PHC Registered • Digital Queue & Audio Call Enabled</p>
      </div>
    </footer>
  );
}
