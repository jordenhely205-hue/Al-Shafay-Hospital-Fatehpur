import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function UrduMarqueeStrip() {
  const noticeUrduText = "محترم مریضوں کے لیے ضروری اطلاع: او پی ڈی ٹوکن کے لیے اصل شناختی کارڈ ہمراہ لائیں • ایمرجنسی 24 گھنٹے فعال ہے • ڈاکٹرز کے معائنے کے اوقات صبح 9 بجے سے دوپہر 2 بجے تک ہیں • واٹس ایپ پر آن لائن رابطہ کے لیے 03016167412 پر میسج کریں۔";

  return (
    <div className="bg-gradient-to-r from-[#081E48] via-[#0B3B82] to-[#081E48] text-white border-b border-blue-900/50 shadow-inner no-print overflow-hidden select-none py-1.5 px-3">
      <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
        
        {/* Urgent Ticker Pill */}
        <div className="shrink-0 flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          <span className="hidden sm:inline">اہم اطلاع</span>
          <span className="sm:hidden">اطلاع</span>
        </div>

        {/* Marquee Ticker Track (RTL Respecting) */}
        <div className="flex-1 marquee-container overflow-hidden relative cursor-default" dir="rtl" title="ماؤس اوپر لائیں تو سکرول رک جائے گا">
          <div className="marquee-content font-urdu text-xs sm:text-[13px] font-bold text-amber-200 tracking-wide" dir="rtl">
            <span>{noticeUrduText}</span>
            <span className="mx-8 text-cyan-300">•</span>
            <span>{noticeUrduText}</span>
          </div>
        </div>

        {/* WhatsApp Direct Mini Chip */}
        <a
          href="https://api.whatsapp.com/send?phone=923016167412"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full transition shadow-xs shrink-0"
          title="Direct WhatsApp Support: 03016167412"
        >
          <MessageCircle size={13} className="shrink-0" />
          <span>03016167412</span>
        </a>


      </div>
    </div>
  );
}

