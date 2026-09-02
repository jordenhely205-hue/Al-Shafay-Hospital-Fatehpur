import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppFloatButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  const prefilledMessage = "Hello Al-Shafay-Hospital-Fatehpur Clinic, I want to book an appointment";
  const whatsappUrl = `https://wa.me/923016167412?text=${encodeURIComponent(prefilledMessage)}`;

  return (
    <div className="whatsapp-float-widget fixed bottom-6 right-6 z-50 flex flex-col items-end no-print select-none">
      
      {/* Floating Callout Bubble */}
      {showTooltip && (
        <div className="mb-2 bg-white border border-emerald-300 rounded-2xl p-3 shadow-2xl max-w-[230px] animate-in fade-in slide-in-from-bottom-3 duration-300 relative group">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute -top-2 -left-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-0.5 shadow-xs transition cursor-pointer"
            title="Dismiss notice"
          >
            <X size={12} />
          </button>
          
          <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs font-outfit mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>24/7 WhatsApp Helpline</span>
          </div>
          
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            آن لائن اپائنٹمنٹ اور معلومات کے لیے ابھی واٹس ایپ پر رابطہ کریں۔
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-center font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg transition shadow-xs"
          >
            Book via WhatsApp (03016167412)
          </a>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-4 py-3.5 rounded-full shadow-xl shadow-emerald-900/25 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-white/30"
        title="Chat on WhatsApp (03016167412)"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-black text-white items-center justify-center">1</span>
        </span>

        <MessageCircle size={24} className="animate-pulse shrink-0" />
        
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 leading-none">Instant Booking</span>
          <span className="text-xs font-black tracking-wide leading-tight">WhatsApp Help</span>
        </div>
      </a>

    </div>
  );
}

