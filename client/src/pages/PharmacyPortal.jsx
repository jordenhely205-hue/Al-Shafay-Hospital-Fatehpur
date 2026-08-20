import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import InvoicePrintModal from '../components/InvoicePrintModal';
import { 
  Pill, 
  ShoppingCart, 
  Package, 
  Printer, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  DollarSign, 
  Clock, 
  FileText,
  AlertTriangle,
  Send,
  Building2
} from 'lucide-react';

export default function PharmacyPortal() {
  const { subscribe } = useSocket();
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'prescriptions' | 'inventory' | 'invoices'

  // Prescriptions Feed
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Inventory State
  const [inventory, setInventory] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMed, setNewMed] = useState({
    brandName: '',
    genericName: '',
    dosageForm: 'Tablet',
    strength: '',
    unitPrice: '',
    stockQuantity: '',
    batchNumber: '',
    expiryDate: '',
    minStockThreshold: 20
  });

  // POS Cart State
  const [cartItems, setCartItems] = useState([]);
  const [patientInfo, setPatientInfo] = useState({ name: 'Walk-in Patient', phone: '', mrn: '' });
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Invoices & Print
  const [invoices, setInvoices] = useState([]);
  const [printedInvoice, setPrintedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'PRESCRIPTION_CREATED') {
        loadPendingPrescriptions();
      }
      if (event.type === 'PRESCRIPTION_DISPENSED') {
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const [prescRes, invRes, invsRes] = await Promise.all([
        api.getPendingPrescriptions(),
        api.getInventory(),
        api.getInvoices()
      ]);
      if (prescRes.success) setPendingPrescriptions(prescRes.prescriptions);
      if (invRes.success) setInventory(invRes.medicines);
      if (invsRes.success) setInvoices(invsRes.invoices);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPendingPrescriptions = async () => {
    try {
      const res = await api.getPendingPrescriptions();
      if (res.success) setPendingPrescriptions(res.prescriptions);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPrescriptionToDispense = (p) => {
    setSelectedPrescription(p);
    setPatientInfo({
      name: p.patientName,
      phone: '',
      mrn: p.patientId
    });

    const itemsFromRx = (p.medicines || []).map(med => {
      const matched = inventory.find(i => i.brandName.toLowerCase().includes(med.name.toLowerCase()) || med.name.toLowerCase().includes(i.brandName.toLowerCase()));
      const price = matched ? matched.unitPrice : 30;
      return {
        medicineId: matched ? matched.id : 'med-custom',
        brandName: med.name,
        dosageForm: matched ? matched.dosageForm : 'Tablet',
        quantity: 10,
        unitPrice: price,
        total: price * 10
      };
    });

    setCartItems(itemsFromRx);
    setActiveTab('pos');
    setMsg({ type: 'success', text: `Loaded digital prescription for ${p.patientName} into POS!` });
  };

  const addToCart = (med) => {
    const existing = cartItems.find(item => item.medicineId === med.id);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.medicineId === med.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCartItems([
        ...cartItems,
        {
          medicineId: med.id,
          brandName: med.brandName,
          dosageForm: med.dosageForm,
          quantity: 1,
          unitPrice: med.unitPrice,
          total: med.unitPrice
        }
      ]);
    }
  };

  const updateCartQty = (idx, qty) => {
    const num = Math.max(1, parseInt(qty) || 1);
    const updated = [...cartItems];
    updated[idx].quantity = num;
    updated[idx].total = num * updated[idx].unitPrice;
    setCartItems(updated);
  };

  const removeFromCart = (idx) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalAmount = Math.max(0, subtotal - Number(discount || 0));

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setMsg({ type: 'error', text: 'Cart is empty. Select medicines to checkout.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        prescriptionId: selectedPrescription ? selectedPrescription.id : null,
        patientName: patientInfo.name,
        patientMrn: patientInfo.mrn,
        items: cartItems,
        subtotal,
        discount: Number(discount),
        totalAmount,
        paymentMethod,
        pharmacistName: 'Muhammad Salman (R.Ph)'
      };

      const res = await api.dispensePrescription(payload);
      if (res.success) {
        setPrintedInvoice(res.invoice);
        setMsg({ type: 'success', text: `Invoice #${res.invoice.invoiceNumber} generated! Inventory updated.` });
        setCartItems([]);
        setSelectedPrescription(null);
        setDiscount(0);
        loadData();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Checkout failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addMedicine({
        ...newMed,
        unitPrice: Number(newMed.unitPrice),
        stockQuantity: Number(newMed.stockQuantity),
        minStockThreshold: Number(newMed.minStockThreshold)
      });
      if (res.success) {
        setShowAddMedModal(false);
        setMsg({ type: 'success', text: `${newMed.brandName} added to pharmacy inventory!` });
        setNewMed({
          brandName: '',
          genericName: '',
          dosageForm: 'Tablet',
          strength: '',
          unitPrice: '',
          stockQuantity: '',
          batchNumber: '',
          expiryDate: '',
          minStockThreshold: 20
        });
        loadData();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to add medicine' });
    }
  };

  const lowStockCount = inventory.filter(m => m.stockQuantity <= (m.minStockThreshold || 20)).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Pharmacy Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Pill size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 uppercase">Pharmacy & POS Dispensing</h1>
                <span className="bg-amber-100 text-amber-900 font-mono text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  Store Counter
                </span>
              </div>
              <p className="text-xs text-amber-800 font-bold">Al-Shafay Hospital Fatehpur • Real-Time Digital Prescription Queue</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Pending Rx</span>
              <span className="text-xl font-black text-[#0B4F9C] font-mono">{pendingPrescriptions.length}</span>
            </div>
            <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-center shadow-2xs">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">Low Stock Alert</span>
              <span className="text-xl font-black text-amber-900 font-mono">{lowStockCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Toolbar */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShoppingCart size={16} />
            <span>POS Billing & Checkout</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
              activeTab === 'prescriptions'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock size={16} />
            <span>Doctor Prescriptions Queue</span>
            {pendingPrescriptions.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-mono font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingPrescriptions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package size={16} />
            <span>Medicine Inventory & Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText size={16} />
            <span>Sales Invoices History ({invoices.length})</span>
          </button>
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

        {/* TAB 1: POS Billing & Dispensing */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Quick Medicine Finder */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900 uppercase">Pharmacy Medicine Catalog</h2>
                <span className="text-xs text-slate-500 font-medium">Click medicine to add to billing cart</span>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Brand Name or Generic Composition..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {inventory
                  .filter(m => !inventorySearch || m.brandName.toLowerCase().includes(inventorySearch.toLowerCase()) || m.genericName.toLowerCase().includes(inventorySearch.toLowerCase()))
                  .map(med => (
                    <div
                      key={med.id}
                      onClick={() => addToCart(med)}
                      className="bg-slate-50 border border-slate-200 hover:border-[#0B4F9C] p-3.5 rounded-2xl cursor-pointer transition flex justify-between items-center shadow-2xs"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900">{med.brandName}</p>
                        <p className="text-[10px] text-slate-500">{med.genericName} • {med.dosageForm}</p>
                        <span className="text-[10px] text-emerald-700 font-extrabold block mt-1">Stock: {med.stockQuantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-slate-900 text-xs block">Rs. {med.unitPrice}</span>
                        <span className="text-[10px] text-[#0B4F9C] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">+ Add</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Billing Checkout Register */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-[#0B4F9C]" />
                    <h3 className="font-black text-xs text-slate-900 uppercase">Checkout Register</h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-50 text-[#0B4F9C] px-2 py-0.5 rounded-full border border-blue-200">
                    {cartItems.length} Items
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Customer / Patient Name</label>
                    <input
                      type="text"
                      value={patientInfo.name}
                      onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cartItems.length > 0 ? (
                    cartItems.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-slate-900 truncate">{item.brandName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">Rs. {item.unitPrice} each</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartQty(idx, e.target.value)}
                            className="w-14 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold py-1 text-slate-900 text-xs"
                          />
                          <span className="font-mono font-black text-slate-900 w-16 text-right">Rs. {item.total}</span>
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No medicines in billing cart.
                    </div>
                  )}
                </div>
              </div>

              {/* Totals & Payment */}
              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">Rs. {subtotal}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount (PKR):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Payment Mode:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-900 text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="JazzCash">JazzCash / EasyPaisa</option>
                  </select>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-base font-black">
                  <span className="text-slate-900">NET TOTAL:</span>
                  <span className="font-mono text-[#0B4F9C]">Rs. {totalAmount}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-xl transition shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
                >
                  <Printer size={16} />
                  <span>{loading ? 'Processing Sale...' : 'Complete Sale & Print Receipt (80mm)'}</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: Doctor Prescriptions Queue */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 uppercase">Incoming Digital Prescriptions</h2>
              <span className="bg-blue-50 text-[#0B4F9C] text-xs font-mono font-bold px-3 py-1 rounded-full border border-blue-200">
                {pendingPrescriptions.length} Pending Dispense
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPrescriptions.length > 0 ? (
                pendingPrescriptions.map(p => (
                  <div key={p.id} className="bg-slate-50 border border-slate-200 hover:border-[#0B4F9C] rounded-2xl p-5 transition space-y-3 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#0B4F9C] uppercase">
                          Rx #{p.id.slice(-6).toUpperCase()}
                        </span>
                        <h3 className="font-black text-slate-900 text-sm uppercase">{p.patientName}</h3>
                        <p className="text-[10px] text-slate-500">{p.doctorName} • {p.vitals?.bp ? `BP: ${p.vitals.bp}` : ''}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        Pending
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Prescribed Medicines:</span>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        {p.medicines && p.medicines.map((m, i) => (
                          <li key={i} className="text-xs font-medium"><strong className="text-slate-900">{m.name}</strong> ({m.frequency} - {m.duration})</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSelectPrescriptionToDispense(p)}
                      className="w-full bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <ShoppingCart size={14} />
                      <span>Load into POS Register</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  <Clock size={32} className="mx-auto mb-2 text-[#0B4F9C]" />
                  <p>No pending doctor prescriptions in queue.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Inventory */}
        {activeTab === 'inventory' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase">Pharmacy Medicine Inventory</h2>
                <p className="text-xs text-slate-500">Track stock levels, batch numbers, and reorder thresholds</p>
              </div>
              <button
                onClick={() => setShowAddMedModal(true)}
                className="bg-[#0B4F9C] hover:bg-[#083B75] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Medicine Stock</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Medicine Brand</th>
                    <th className="py-3 px-4">Generic Name</th>
                    <th className="py-3 px-4">Dosage Form</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {inventory.map(m => {
                    const isLow = m.stockQuantity <= (m.minStockThreshold || 20);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-black text-slate-900">{m.brandName}</td>
                        <td className="py-3 px-4 text-slate-600">{m.genericName}</td>
                        <td className="py-3 px-4 text-slate-500">{m.dosageForm}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">Rs. {m.unitPrice}</td>
                        <td className="py-3 px-4 font-mono font-black text-slate-900">{m.stockQuantity}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isLow ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Invoices History */}
        {activeTab === 'invoices' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 uppercase">Sales Invoices & Receipts History</h2>
              <span className="text-xs text-slate-500 font-medium">Re-print or review completed pharmacy sales</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer / Patient</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 font-mono">Total Paid</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#0B4F9C]">{inv.invoiceNumber || inv.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 uppercase">{inv.patientName}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(inv.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="py-3 px-4 font-semibold">{inv.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono font-black text-emerald-800">Rs. {inv.totalAmount}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setPrintedInvoice(inv)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 rounded-lg text-xs inline-flex items-center gap-1 transition"
                        >
                          <Printer size={14} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Add Medicine Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-slate-900">Add New Medicine to Stock</h3>

            <form onSubmit={handleAddMedicine} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin 625mg"
                  value={newMed.brandName}
                  onChange={(e) => setNewMed({ ...newMed, brandName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#0B4F9C]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Generic Formula *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Co-Amoxiclav"
                  value={newMed.genericName}
                  onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#0B4F9C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="350"
                    value={newMed.unitPrice}
                    onChange={(e) => setNewMed({ ...newMed, unitPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#0B4F9C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Stock Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={newMed.stockQuantity}
                    onChange={(e) => setNewMed({ ...newMed, stockQuantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-[#0B4F9C]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Save Medicine
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printedInvoice && (
        <InvoicePrintModal
          invoice={printedInvoice}
          onClose={() => setPrintedInvoice(null)}
        />
      )}

    </div>
  );
}
