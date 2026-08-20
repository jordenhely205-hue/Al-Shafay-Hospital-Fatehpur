import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import LabReportModal from '../components/LabReportModal';
import ScanLightboxModal from '../components/ScanLightboxModal';
import { 
  FlaskConical, 
  CheckCircle2, 
  Search, 
  Printer, 
  Edit3, 
  FileCheck, 
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Eye
} from 'lucide-react';

export default function LaboratoryPortal() {
  const { subscribe } = useSocket();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQ, setSearchQ] = useState('');

  // Selected Order for Result Entry
  const [editingOrder, setEditingOrder] = useState(null);
  const [resultParams, setResultParams] = useState([]);
  const [attachedImages, setAttachedImages] = useState([]);
  const [techNotes, setTechNotes] = useState('');
  const [pathNotes, setPathNotes] = useState('');
  const [specimenBarcode, setSpecimenBarcode] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Lightbox & Print Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadOrders();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'LAB_ORDERS_CREATED' || event.type === 'LAB_ORDER_UPDATED' || event.type === 'LAB_RESULT_READY') {
        loadOrders();
      }
    });

    return () => unsubscribe();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      const res = await api.getLabOrders({ status: filterStatus });
      if (res.success) {
        setOrders(res.orders);
        setStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartResultEntry = (order) => {
    setEditingOrder(order);
    setResultParams(order.parameters && order.parameters.length > 0 ? JSON.parse(JSON.stringify(order.parameters)) : [
      { name: 'Investigation Parameter', value: '', unit: '', referenceRange: '', flag: 'NORMAL' }
    ]);
    setAttachedImages(order.images && order.images.length > 0 ? [...order.images] : []);
    setTechNotes(order.technicianNotes || '');
    setPathNotes(order.pathologistRemarks || 'Specimen processed on calibrated analyzer. Diagnostic scan attached and verified.');
    setSpecimenBarcode(order.specimenBarcode || `SPEC-${order.id.slice(-6).toUpperCase()}`);
  };

  const handleUpdateParamValue = (index, value) => {
    const updated = [...resultParams];
    updated[index].value = value;
    setResultParams(updated);
  };

  const handleUpdateParamFlag = (index, flag) => {
    const updated = [...resultParams];
    updated[index].flag = flag;
    setResultParams(updated);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateLabOrderStatus(orderId, newStatus);
      if (res.success) {
        setMsg({ type: 'success', text: `Order status updated to ${newStatus}` });
        loadOrders();
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Status update failed' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('scanImage', file);

      const res = await api.uploadScan(formData);
      if (res.success && res.imageUrl) {
        setAttachedImages(prev => [...prev, res.imageUrl]);
        setMsg({ type: 'success', text: `Scan image uploaded successfully!` });
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSampleScanPreset = (type) => {
    let presetUrl = '';
    if (type === 'xray') {
      presetUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700" fill="%230b0f19"><rect width="100%" height="100%" fill="%23050811"/><text x="20" y="40" fill="%232dd4bf" font-family="monospace" font-size="14" font-weight="bold">AL-SHAFAY HOSPITAL FATEHPUR | CHEST PA VIEW</text><text x="20" y="60" fill="%2394a3b8" font-family="monospace" font-size="11">SCAN DATE: ${new Date().toLocaleDateString()}</text><path d="M 300 120 C 230 180 180 320 200 520 C 250 560 300 530 300 530 C 300 530 350 560 400 520 C 420 320 370 180 300 120 Z" fill="%231e293b" opacity="0.8"/><ellipse cx="300" cy="400" rx="60" ry="85" fill="%23475569" opacity="0.75"/><g stroke="%23cbd5e1" stroke-width="4" fill="none" opacity="0.6"><path d="M 280 200 Q 230 220 200 240"/><path d="M 320 200 Q 370 220 400 240"/><path d="M 280 250 Q 220 280 190 310"/><path d="M 320 250 Q 380 280 410 310"/><path d="M 280 300 Q 210 340 185 380"/><path d="M 320 300 Q 390 340 415 380"/><path d="M 280 350 Q 210 400 190 450"/><path d="M 320 350 Q 390 400 410 450"/></g><line x1="300" y1="120" x2="300" y2="580" stroke="%2394a3b8" stroke-width="6" stroke-dasharray="8,6" opacity="0.8"/><text x="490" y="660" fill="%23f43f5e" font-family="sans-serif" font-size="20" font-weight="black">R</text></svg>`;
    } else if (type === 'ultrasound') {
      presetUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500" fill="%23020617"><rect width="100%" height="100%" fill="%23020617"/><text x="20" y="30" fill="%23a855f7" font-family="monospace" font-size="13" font-weight="bold">AL-SHAFAY USG DEPT | ABDOMEN &amp; PELVIS</text><path d="M 300 80 L 100 440 A 300 120 0 0 0 500 440 Z" fill="%230f172a" stroke="%23334155" stroke-width="2"/><circle cx="280" cy="270" r="45" fill="%231e293b" stroke="%2364748b" stroke-width="2" stroke-dasharray="3,3"/><ellipse cx="360" cy="330" rx="35" ry="25" fill="%23334155" opacity="0.7"/><text x="250" y="275" fill="%23e2e8f0" font-family="sans-serif" font-size="11">GALLBLADDER</text><text x="30" y="480" fill="%2364748b" font-family="monospace" font-size="10">GAIN: 88dB | DEPTH: 16cm | FREQ: 3.5MHz</text></svg>`;
    } else {
      presetUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="350" viewBox="0 0 700 350" fill="%230a0f1d"><rect width="100%" height="100%" fill="%230a0f1d"/><g stroke="%231e293b" stroke-width="1"><line x1="0" y1="50" x2="700" y2="50"/><line x1="0" y1="100" x2="700" y2="100"/><line x1="0" y1="150" x2="700" y2="150"/><line x1="0" y1="200" x2="700" y2="200"/><line x1="0" y1="250" x2="700" y2="250"/><line x1="0" y1="300" x2="700" y2="300"/></g><text x="20" y="30" fill="%2322c55e" font-family="monospace" font-size="13" font-weight="bold">LEAD II - 12 LEAD ECG TRACING | 25mm/s 10mm/mV</text><path d="M 20 180 L 100 180 Q 110 170 120 180 L 135 180 L 140 200 L 150 90 L 160 220 L 165 180 L 190 180 Q 210 160 230 180 L 300 180 Q 310 170 320 180 L 335 180 L 340 200 L 350 90 L 360 220 L 365 180 L 390 180 Q 410 160 430 180 L 500 180 Q 510 170 520 180 L 535 180 L 540 200 L 550 90 L 560 220 L 565 180 L 590 180 Q 610 160 630 180 L 680 180" fill="none" stroke="%2322c55e" stroke-width="3"/></svg>`;
    }

    setAttachedImages(prev => [...prev, presetUrl]);
    setMsg({ type: 'success', text: `Attached sample ${type.toUpperCase()} scan.` });
  };

  const handleRemoveImage = (index) => {
    setAttachedImages(attachedImages.filter((_, i) => i !== index));
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    setLoading(true);
    try {
      const res = await api.submitLabResults(editingOrder.id, {
        parameters: resultParams,
        images: attachedImages,
        specimenBarcode,
        technicianNotes: techNotes,
        pathologistRemarks: pathNotes
      });

      if (res.success) {
        setMsg({ type: 'success', text: `Results recorded for ${editingOrder.patientName} (${editingOrder.testName})! Report ready.` });
        setEditingOrder(null);
        setSelectedReport(res.order);
        loadOrders();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit results' });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    !searchQ || 
    o.patientName.toLowerCase().includes(searchQ.toLowerCase()) || 
    o.testName.toLowerCase().includes(searchQ.toLowerCase()) ||
    o.id.includes(searchQ)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <FlaskConical size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 uppercase">Diagnostic Laboratory & Radiology</h1>
                <span className="bg-purple-100 text-purple-900 font-mono text-xs font-black px-2.5 py-0.5 rounded-full border border-purple-300">
                  Pathology & Scans
                </span>
              </div>
              <p className="text-xs text-purple-800 font-bold">Al-Shafay Hospital Fatehpur • Diagnostic Requisitions Feed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Orders</span>
              <span className="text-xl font-black text-slate-900 font-mono">{stats.total}</span>
            </div>
            <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-center shadow-2xs">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">Pending</span>
              <span className="text-xl font-black text-amber-900 font-mono">{stats.pending}</span>
            </div>
            <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Completed</span>
              <span className="text-xl font-black text-emerald-900 font-mono">{stats.completed}</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {msg.text && (
          <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 ${
            msg.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {msg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-700" /> : <AlertCircle size={16} className="text-rose-700" />}
              <span>{msg.text}</span>
            </div>
            <button onClick={() => setMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All Orders', value: '' },
              { label: 'Pending Collection', value: 'PENDING' },
              { label: 'Sample Collected', value: 'SAMPLE_COLLECTED' },
              { label: 'Completed Reports', value: 'COMPLETED' }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterStatus === f.value
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient, Test, Lab ID..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white"
            />
          </div>

        </div>

        {/* Orders Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <th className="py-3 px-4">Lab Req #</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Diagnostic Test</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Scans / Images</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => {
                    const isDone = order.status === 'COMPLETED';
                    const hasScans = order.images && order.images.length > 0;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">
                          #{order.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 uppercase">{order.patientName}</p>
                          <p className="text-[10px] text-slate-500">{order.patientAge ? `${order.patientAge} Yrs` : ''} • {order.patientGender}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{order.testName}</p>
                          <p className="text-[10px] text-purple-700 font-semibold">{order.category}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {order.doctorName}
                        </td>
                        <td className="py-3 px-4">
                          {hasScans ? (
                            <button
                              onClick={() => setLightboxData({ images: order.images, title: order.testName, patientName: order.patientName })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#0B4F9C] text-[10px] font-bold hover:bg-blue-100 transition cursor-pointer"
                            >
                              <ImageIcon size={12} />
                              <span>{order.images.length} Scan(s)</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No images</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            order.status === 'SAMPLE_COLLECTED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'SAMPLE_COLLECTED')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
                            >
                              Collect Sample
                            </button>
                          )}

                          <button
                            onClick={() => handleStartResultEntry(order)}
                            className="bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          >
                            <Edit3 size={13} />
                            <span>{isDone ? 'Edit Results / Scans' : 'Upload Scan & Record'}</span>
                          </button>

                          {isDone && (
                            <button
                              onClick={() => setSelectedReport(order)}
                              className="bg-[#0B4F9C] hover:bg-[#083B75] text-white p-1.5 rounded-lg text-[11px] inline-flex items-center transition cursor-pointer shadow-2xs"
                              title="Print A4 Verified Report"
                            >
                              <Printer size={13} />
                            </button>
                          )}

                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No lab requisitions found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Result Entry & Scan Upload Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 text-slate-900 shadow-2xl space-y-5 my-8">
            
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-purple-700 uppercase block">
                  Requisition #{editingOrder.id.slice(-6).toUpperCase()}
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase">{editingOrder.testName}</h3>
                <p className="text-xs text-slate-500">Patient: <strong className="text-slate-900">{editingOrder.patientName}</strong> • Doctor: {editingOrder.doctorName}</p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
            </div>

            <form onSubmit={handleSubmitResults} className="space-y-5 text-xs">
              
              {/* Scan Upload Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UploadCloud size={16} className="text-[#0B4F9C]" />
                    <span className="font-bold text-xs text-slate-900 uppercase">Diagnostic Scans & Radiology Images</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddSampleScanPreset('xray')}
                      className="bg-white hover:bg-slate-100 text-[#0B4F9C] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition"
                    >
                      + Sample X-Ray
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleScanPreset('ultrasound')}
                      className="bg-white hover:bg-slate-100 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition"
                    >
                      + Sample Ultrasound
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleScanPreset('ecg')}
                      className="bg-white hover:bg-slate-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition"
                    >
                      + Sample ECG Strip
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="scan-upload-input"
                  />
                  <label
                    htmlFor="scan-upload-input"
                    className="flex-1 border-2 border-dashed border-slate-300 hover:border-[#0B4F9C] rounded-xl p-4 text-center cursor-pointer transition bg-white hover:bg-blue-50/50"
                  >
                    <UploadCloud size={20} className="mx-auto mb-1 text-slate-400" />
                    <span className="text-slate-700 font-bold block">
                      {uploadingImage ? 'Uploading Scan...' : 'Click to select scan image from computer (.png, .jpg, .dicom)'}
                    </span>
                  </label>
                </div>

                {attachedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="relative group bg-slate-900 rounded-xl overflow-hidden border border-slate-200 aspect-video">
                        <img src={img} alt="Scan preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLightboxData({ images: attachedImages, initialIndex: idx, title: editingOrder.testName, patientName: editingOrder.patientName })}
                            className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition"
                            title="Inspect Lightbox"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition"
                            title="Remove Scan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parameters Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Test Parameter / Observation</th>
                      <th className="py-2.5 px-3">Result Value *</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Reference Range</th>
                      <th className="py-2.5 px-3">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {resultParams.map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            required
                            placeholder="Enter findings"
                            value={p.value}
                            onChange={(e) => handleUpdateParamValue(idx, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold font-mono focus:outline-none focus:border-purple-600 focus:bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{p.unit || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{p.referenceRange || '-'}</td>
                        <td className="py-2.5 px-3">
                          <select
                            value={p.flag || 'NORMAL'}
                            onChange={(e) => handleUpdateParamFlag(idx, e.target.value)}
                            className={`bg-slate-50 border rounded-lg px-2 py-1 text-[11px] font-bold ${
                              p.flag === 'HIGH' ? 'border-red-400 text-red-700' :
                              p.flag === 'LOW' ? 'border-blue-400 text-blue-700' :
                              'border-slate-300 text-emerald-700'
                            }`}
                          >
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">HIGH ↑</option>
                            <option value="LOW">LOW ↓</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Technologist Notes / Findings</label>
                  <input
                    type="text"
                    placeholder="e.g. Scans acquired on Digital DR System"
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pathologist / Radiologist Verification</label>
                  <input
                    type="text"
                    value={pathNotes}
                    onChange={(e) => setPathNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold py-3 rounded-xl transition shadow-md shadow-purple-900/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck size={16} />
                  <span>{loading ? 'Submitting...' : 'Submit Results, Scans & Generate Report'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {selectedReport && (
        <LabReportModal
          order={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {lightboxData && (
        <ScanLightboxModal
          images={lightboxData.images}
          initialIndex={lightboxData.initialIndex || 0}
          title={lightboxData.title}
          patientName={lightboxData.patientName}
          onClose={() => setLightboxData(null)}
        />
      )}

    </div>
  );
}
