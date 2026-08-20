import React from 'react';
import { Printer, X } from 'lucide-react';

export default function InvoicePrintModal({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = new Date(invoice.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        
        <div className="flex justify-between items-center no-print">
          <span className="text-xs font-black uppercase text-[#0B4F9C]">Pharmacy Receipt Preview (80mm)</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Printable 80mm Container */}
        <div className="thermal-slip-container bg-white border border-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
          
          <div className="text-center space-y-1">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
            <h1 className="font-black text-sm uppercase text-slate-900 tracking-tight">Al-Shafay Hospital</h1>
            <p className="text-[10px] font-bold text-slate-700 uppercase">Pharmacy & Medical Store • Fatehpur</p>
            <p className="text-[9px] text-slate-500">Helpline: 0300-1234567 • License: PH-88902</p>
          </div>

          <div className="divider border-b border-dashed border-slate-400 my-2"></div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Invoice #:</span>
              <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber || invoice.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date/Time:</span>
              <span>{formattedDate} {formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Patient:</span>
              <span className="font-bold uppercase">{invoice.patientName}</span>
            </div>
            {invoice.doctorName && (
              <div className="flex justify-between">
                <span className="text-slate-600">Prescribed By:</span>
                <span>{invoice.doctorName}</span>
              </div>
            )}
          </div>

          <div className="divider border-b border-dashed border-slate-400 my-2"></div>

          {/* Items Table */}
          <table className="w-full text-[10px] my-2">
            <thead>
              <tr className="border-b border-dashed border-slate-400 font-bold">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-slate-200">
              {invoice.items && invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 font-sans">{item.name || item.brandName}</td>
                  <td className="text-center py-1 font-mono">{item.quantity}</td>
                  <td className="text-right py-1 font-mono">{item.unitPrice}</td>
                  <td className="text-right py-1 font-mono font-bold">Rs. {item.total || (item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divider border-b border-dashed border-slate-400 my-2"></div>

          {/* Totals */}
          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-mono">Rs. {invoice.subtotal || invoice.totalAmount}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Discount:</span>
                <span className="font-mono">- Rs. {invoice.discount}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-900 text-sm font-black">
              <span>NET PAYABLE:</span>
              <span className="font-mono text-[#0B4F9C]">Rs. {invoice.totalAmount}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600">Payment Mode:</span>
              <span className="font-bold uppercase">{invoice.paymentMethod || 'Cash'}</span>
            </div>
          </div>

          <div className="divider border-b border-dashed border-slate-400 my-2"></div>

          <div className="text-center text-[9px] text-slate-500 space-y-0.5 pt-1">
            <p>Medicines once sold can only be exchanged within 3 days with original receipt.</p>
            <p className="font-bold text-slate-700">Get well soon! - Al-Shafay Hospital</p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Receipt (80mm)</span>
          </button>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
