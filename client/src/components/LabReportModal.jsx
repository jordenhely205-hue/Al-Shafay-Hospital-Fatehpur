import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export default function LabReportModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.completedAt || order.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto" aria-modal="true">
      
      {/* On-Screen Modal Preview Shell (max-w-3xl, max-h-[90vh], scrollable) */}
      <div className="max-w-3xl max-h-[90vh] overflow-y-auto w-full mx-auto p-6 bg-white shadow-2xl rounded-2xl border border-slate-200 space-y-4 my-auto">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex justify-between items-center no-print pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-black text-base text-[#0B4F9C] uppercase font-outfit">Diagnostic Laboratory Report</h3>
            <p className="text-xs text-slate-500">A4 Single-Page Verified Clinical Report</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Printer size={15} />
              <span>Print A4 Report</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Strict Single-Sheet Printable Container */}
        <div id="printable-report" className="printable-a4-sheet a4-document-container printable-content bg-white text-xs space-y-3">
          
          {/* Header Bar: Top-Left Logo, Center Hospital Info, Top-Right Order ID */}
          <div className="header-bar flex items-center justify-between pb-2.5 border-b-2 border-[#0B4F9C] gap-3">
            
            {/* Top-Left Logo (max-height 55px, auto width) */}
            <div className="shrink-0 flex items-center w-20">
              <img 
                src="/logo.png" 
                alt="Hospital Logo" 
                className="max-h-[55px] w-auto object-contain shrink-0" 
              />
            </div>

            {/* Center: Hospital Name & Department Info */}
            <div className="text-center flex-1 px-1">
              <h1 className="text-lg sm:text-xl font-black uppercase text-[#0B4F9C] tracking-tight font-outfit leading-tight">
                Al-Shafay Hospital Fatehpur
              </h1>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Department of Diagnostic Pathology & Radiology
              </p>
              <p className="text-[9px] text-slate-500 font-medium">
                Hospital Road, Fatehpur, Layyah • 24/7 Helpline: 0300-1234567
              </p>
            </div>

            {/* Top-Right: Order ID & Date Block */}
            <div className="text-right shrink-0 w-28">
              <div className="bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 inline-block text-right mb-0.5">
                <span className="text-[8.5px] text-purple-700 font-bold uppercase block">Lab Order ID</span>
                <span className="text-xs font-mono font-black text-purple-900">#{order.id.slice(-6).toUpperCase()}</span>
              </div>
              <p className="text-[9.5px] text-slate-600 font-bold">Date: {formattedDate}</p>
            </div>

          </div>

          {/* Patient Details Bar */}
          <div className="patient-details-box grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Patient Name</span>
              <strong className="text-slate-900 uppercase font-black text-[11px]">{order.patientName}</strong>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Age / Gender</span>
              <span className="text-slate-800 font-semibold text-[11px]">{order.patientAge ? `${order.patientAge} Yrs` : '-'} / {order.patientGender || 'Male'}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Specimen Barcode</span>
              <span className="text-slate-800 font-mono font-bold text-[11px]">{order.specimenBarcode || 'SPEC-098231'}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Referred By Doctor</span>
              <strong className="text-[#0B4F9C] font-bold text-[11px]">{order.doctorName}</strong>
            </div>
          </div>

          {/* Test Name & Verified Banner */}
          <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Investigation Conducted</span>
              <h2 className="text-xs sm:text-sm font-black text-[#0B4F9C] uppercase font-outfit">{order.testName}</h2>
            </div>
            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black">
              <CheckCircle2 size={12} />
              <span>Verified Report</span>
            </div>
          </div>

          {/* Test Parameters Table (Compact Padding) */}
          {order.parameters && order.parameters.length > 0 && (
            <div className="space-y-1">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[8.5px]">
                  <tr>
                    <th className="py-1 px-2">Test Parameter / Observation</th>
                    <th className="py-1 px-2">Result Value</th>
                    <th className="py-1 px-2">Unit</th>
                    <th className="py-1 px-2">Reference Range</th>
                    <th className="py-1 px-2 text-right">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.parameters.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1 px-2 font-semibold text-slate-800 text-[10.5px]">{p.name}</td>
                      <td className="py-1 px-2 font-black text-slate-900 font-mono text-[11px]">{p.value}</td>
                      <td className="py-1 px-2 text-slate-500 font-mono text-[9.5px]">{p.unit || '-'}</td>
                      <td className="py-1 px-2 text-slate-600 text-[9.5px]">{p.referenceRange || '-'}</td>
                      <td className="py-1 px-2 text-right">
                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold ${
                          p.flag === 'HIGH' ? 'bg-red-100 text-red-800' :
                          p.flag === 'LOW' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.flag || 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Attached Scans (if any) */}
          {order.images && order.images.length > 0 && (
            <div className="space-y-1">
              <span className="text-[8.5px] font-black uppercase text-slate-600 block">Attached Diagnostic Scan Preview</span>
              <div className="grid grid-cols-2 gap-2">
                {order.images.slice(0, 2).map((img, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 max-h-24 flex items-center justify-center p-1">
                    <img src={img} alt="Attached scan" className="max-h-20 object-contain rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technologist & Pathologist Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
            <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[8.5px] font-bold uppercase text-slate-500 block mb-0.5">Technologist Remarks</span>
              <p className="text-slate-700 text-[9.5px]">{order.technicianNotes || 'Specimen processed on automated clinical analyzer.'}</p>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[8.5px] font-bold uppercase text-slate-500 block mb-0.5">Pathologist Opinion</span>
              <p className="text-slate-900 font-semibold text-[9.5px]">{order.pathologistRemarks || 'Findings correlate with clinical presentation. Verified.'}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="signature-bar pt-3 flex justify-between items-end text-xs">
            <div className="text-center w-36">
              <div className="border-b border-slate-400 pb-0.5 mb-0.5">
                <span className="font-mono font-bold text-slate-700 text-[9.5px]">Kashif Rasheed (MLT)</span>
              </div>
              <span className="text-[8.5px] text-slate-500 uppercase font-bold block">Lab Technologist</span>
            </div>

            <div className="text-center w-48">
              <div className="border-b border-slate-400 pb-0.5 mb-0.5">
                <span className="font-mono font-bold text-[#0B4F9C] text-[9.5px]">Dr. Sajjad Hussain (MBBS, M.Phil)</span>
              </div>
              <span className="text-[8.5px] text-slate-500 uppercase font-bold block">Consultant Pathologist</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
