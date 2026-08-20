import React from 'react';
import { Printer, X } from 'lucide-react';

export default function PrescriptionPrintModal({ prescription, onClose }) {
  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(prescription.createdAt || Date.now()).toLocaleDateString('en-GB', {
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
            <h3 className="font-black text-base text-[#0B4F9C] uppercase font-outfit">Clinical Prescription Pad</h3>
            <p className="text-xs text-slate-500">A4 Single-Page Printable Letterhead</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Printer size={15} />
              <span>Print A4 Prescription</span>
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
        <div id="printable-prescription" className="printable-a4-sheet a4-document-container printable-content bg-white text-xs space-y-3">
          
          {/* Header Bar: Top-Left Logo, Center Hospital Info, Top-Right Token Block */}
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
                Department of Clinical Medicine & Outpatient Services
              </p>
              <p className="text-[9px] text-slate-500 font-medium">
                Hospital Road, Fatehpur, Layyah • 24/7 Helpline: 0300-1234567
              </p>
            </div>

            {/* Top-Right: Token & Date Block */}
            <div className="text-right shrink-0 w-28">
              <div className="bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 inline-block text-right mb-0.5">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Token #</span>
                <span className="text-xs font-mono font-black text-[#0B4F9C]">#{prescription.tokenNumber || prescription.tokenId}</span>
              </div>
              <p className="text-[9.5px] text-slate-600 font-bold">Date: {formattedDate}</p>
            </div>

          </div>

          {/* Patient Details Bar */}
          <div className="patient-details-box grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Patient Name</span>
              <strong className="text-slate-900 uppercase font-black text-[11px]">{prescription.patientName}</strong>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Age / Gender</span>
              <span className="text-slate-800 font-semibold text-[11px]">{prescription.patientAge ? `${prescription.patientAge} Yrs` : '-'} / {prescription.patientGender || 'Male'}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">MRN / Patient ID</span>
              <span className="text-slate-800 font-mono font-bold text-[11px]">{prescription.patientId}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Consultant Doctor</span>
              <strong className="text-[#0B4F9C] font-bold text-[11px]">{prescription.doctorName}</strong>
            </div>
          </div>

          {/* Vitals Summary */}
          {prescription.vitals && (
            <div className="vitals-box p-2 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-wrap justify-between gap-2 text-xs">
              <div><span className="text-slate-500 font-bold text-[9.5px]">BP:</span> <strong className="text-slate-900 font-mono text-[10.5px]">{prescription.vitals.bp || '120/80'}</strong> mmHg</div>
              <div><span className="text-slate-500 font-bold text-[9.5px]">Pulse:</span> <strong className="text-slate-900 font-mono text-[10.5px]">{prescription.vitals.pulse || '76'}</strong> bpm</div>
              <div><span className="text-slate-500 font-bold text-[9.5px]">Temp:</span> <strong className="text-slate-900 font-mono text-[10.5px]">{prescription.vitals.temp || '98.6'}</strong> °F</div>
              <div><span className="text-slate-500 font-bold text-[9.5px]">SpO2:</span> <strong className="text-slate-900 font-mono text-[10.5px]">{prescription.vitals.spo2 || '99'}</strong> %</div>
              <div><span className="text-slate-500 font-bold text-[9.5px]">Weight:</span> <strong className="text-slate-900 font-mono text-[10.5px]">{prescription.vitals.weight || '70'}</strong> kg</div>
            </div>
          )}

          {/* Clinical Findings & Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {prescription.chiefComplaints && (
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[8.5px] uppercase font-bold text-slate-500 block mb-0.5">Chief Complaints</span>
                <p className="text-slate-800 text-[10px]">{prescription.chiefComplaints}</p>
              </div>
            )}
            {prescription.diagnosis && (
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[8.5px] uppercase font-bold text-slate-500 block mb-0.5">Clinical Diagnosis</span>
                <p className="text-slate-900 font-black text-[10px]">{prescription.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Rx Medicines Table */}
          {prescription.medicines && prescription.medicines.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-serif text-[#0B4F9C]">Rx</span>
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700">Prescribed Medications</span>
              </div>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[8.5px]">
                  <tr>
                    <th className="py-1 px-2">#</th>
                    <th className="py-1 px-2">Medicine & Dosage</th>
                    <th className="py-1 px-2">Frequency</th>
                    <th className="py-1 px-2">Duration</th>
                    <th className="py-1 px-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {prescription.medicines.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1 px-2 font-mono font-bold text-slate-500 text-[9.5px]">{idx + 1}</td>
                      <td className="py-1 px-2">
                        <strong className="text-slate-900 block text-[10.5px]">{m.name}</strong>
                        <span className="text-[8.5px] text-slate-500">{m.dosage}</span>
                      </td>
                      <td className="py-1 px-2 font-bold text-emerald-800 font-mono text-[9.5px]">{m.frequency}</td>
                      <td className="py-1 px-2 text-[9.5px]">{m.duration}</td>
                      <td className="py-1 px-2 text-slate-600 text-[9.5px]">{m.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Diagnostic Lab Tests Requisition */}
          {prescription.labTests && prescription.labTests.length > 0 && (
            <div className="p-2 bg-purple-50/70 rounded-xl border border-purple-200 space-y-0.5">
              <span className="text-[8.5px] font-black uppercase tracking-wider text-purple-900 block">
                Ordered Diagnostic Laboratory / Radiology Tests
              </span>
              <div className="flex flex-wrap gap-1">
                {prescription.labTests.map((t, idx) => (
                  <span key={idx} className="bg-white border border-purple-300 text-purple-900 font-bold px-2 py-0.2 rounded text-[9px]">
                    {t.testName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Advice & Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
            {prescription.clinicalNotes && (
              <div>
                <span className="text-[8.5px] font-bold uppercase text-slate-500 block mb-0.5">Special Advice / Precautions</span>
                <p className="text-slate-700 text-[9.5px]">{prescription.clinicalNotes}</p>
              </div>
            )}
            {prescription.followUpDate && (
              <div>
                <span className="text-[8.5px] font-bold uppercase text-slate-500 block mb-0.5">Follow-Up Review</span>
                <p className="font-bold text-[#0B4F9C] text-[10px]">Return on: {prescription.followUpDate}</p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="signature-bar pt-3 flex justify-between items-end text-xs">
            <div className="text-[8.5px] text-slate-500">
              <p>Generated by Al-Shafay Hospital Digital EMR System</p>
              <p>Pharmacist: Verify batch & expiry before dispensing</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-slate-400 pb-0.5 mb-0.5">
                <span className="font-mono font-bold text-slate-800 text-[9.5px]">{prescription.doctorName}</span>
              </div>
              <span className="text-[8.5px] text-slate-500 uppercase font-bold block">Consultant Signature & Stamp</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
