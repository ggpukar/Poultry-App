import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Feed, Flock } from '../types';
import NepaliDatePicker from '../components/NepaliDatePicker';
import Skeleton from '../components/Skeleton';
import { Plus, Trash2, Search, AlertCircle, Edit2, X, Save, ChevronDown, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  selectedFlockId: string;
}

export default function FeedManager({ selectedFlockId }: Props) {
  const [items, setItems] = useState<Feed[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [filterFlock, setFilterFlock] = useState(selectedFlockId || '');
  const [searchBill, setSearchBill] = useState('');
  const [loading, setLoading] = useState(true);

  // Form
  const [form, setForm] = useState<Partial<Feed>>({ type: 'B0', rate: 0, quantity: 0, billNo: '' });
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = (withLoading = true) => {
    if (withLoading) setLoading(true);
    setTimeout(() => {
        setFlocks(db.getFlocks());
        setItems(db.getFeeds(filterFlock || undefined));
        if (withLoading) setLoading(false);
    }, withLoading ? 600 : 0);
  };

  useEffect(() => {
    refresh(true);
  }, [filterFlock]);

  useEffect(() => {
      if (selectedFlockId) setFilterFlock(selectedFlockId);
  }, [selectedFlockId]);

  const validateBillNo = (billNo: string) => {
    if (!billNo) return true;
    const allFeeds = db.getFeeds(); 
    // Check if duplicate exists, excluding current item if editing
    const exists = allFeeds.some(f => f.billNo === billNo && f.id !== editingId);
    if (exists) {
        setError(`Bill Number "${billNo}" already exists!`);
        return false;
    }
    setError('');
    return true;
  };

  const handleBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setForm({ ...form, billNo: val });
      if (val) validateBillNo(val);
      else setError('');
  };

  const handleEdit = (item: Feed) => {
    setEditingId(item.id);
    setFilterFlock(item.flockId); 
    
    setForm({
        billNo: item.billNo,
        type: item.type,
        quantity: item.quantity,
        rate: item.rate,
    });
    setDate(item.date);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ type: 'B0', rate: 0, quantity: 0, billNo: '' });
    setDate('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filterFlock) {
        setError("Please select a flock first");
        return;
    }
    if (!form.billNo || !date || !form.quantity || !form.rate) {
        setError("All fields required");
        return;
    }

    if (!validateBillNo(form.billNo)) {
        return;
    }

    const feedData: Feed = {
        id: editingId || Date.now().toString(),
        flockId: filterFlock,
        billNo: form.billNo,
        date,
        type: form.type as any,
        quantity: Number(form.quantity),
        rate: Number(form.rate),
        total: Number(form.quantity) * Number(form.rate)
    };

    if (editingId) {
        try {
            db.updateFeed(feedData);
            setEditingId(null);
            setForm({ type: 'B0', rate: 0, quantity: 0, billNo: '' });
            setDate(''); 
            setError('');
            refresh(false);
        } catch (e: any) {
            setError(e.message);
        }
    } else {
        const res = db.addFeed(feedData);
        if (!res.success) {
            setError(res.error || "Error saving");
        } else {
            setForm({ type: 'B0', rate: 0, quantity: 0, billNo: '' });
            setDate(''); 
            setError('');
            refresh(false);
        }
    }
  };

  const handleDelete = (id: string) => {
      if(confirm('Delete entry?')) {
          db.deleteFeed(id);
          refresh(false);
      }
  };

  // Filter items by bill no
  const displayItems = items.filter(i => i.billNo.includes(searchBill));

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const flockName = flocks.find(f => f.id === filterFlock)?.name || 'All Flocks';

    // Header
    doc.setFontSize(18);
    doc.text(`Feed Report - ${flockName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

    // Table
    const tableData = displayItems.map(item => [
        item.date,
        item.billNo,
        item.type,
        item.quantity,
        item.rate,
        (item.total || 0).toLocaleString()
    ]);

    autoTable(doc, {
        startY: 35,
        head: [['Date (BS)', 'Bill No', 'Type', 'Qty', 'Rate', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue header
        columnStyles: {
            5: { fontStyle: 'bold' } // Total column bold
        },
        foot: [['', '', '', '', 'Total:', `Rs. ${displayItems.reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString()}`]],
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
    });

    const filename = `Feed_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  };

  return (
    <div className="space-y-6">
      <div className={`p-5 rounded-xl shadow-sm border ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{editingId ? 'Edit Entry' : 'New Feed'}</h2>
            {editingId && (
                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                    <X size={16} /> Cancel
                </button>
            )}
        </div>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Flock</label>
                <div className="relative">
                    <select 
                        value={filterFlock} 
                        onChange={e => setFilterFlock(e.target.value)}
                        className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 cursor-pointer transition-colors"
                    >
                        <option value="">-- Select Flock --</option>
                        {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill No</label>
                    <input 
                        type="text" required 
                        value={form.billNo || ''}
                        onChange={handleBillChange}
                        className={`w-full border rounded-lg px-3 py-2 ${error && error.includes('Bill') ? 'border-red-500 focus:ring-red-500' : 'focus:ring-2 focus:ring-blue-500 outline-none'}`}
                        placeholder="#"
                    />
                </div>
                <div>
                     <NepaliDatePicker label="Date (BS)" value={date} onChange={setDate} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feed Type</label>
                <div className="relative">
                    <select 
                        value={form.type} 
                        onChange={e => setForm({...form, type: e.target.value as any})}
                        className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 cursor-pointer transition-colors"
                    >
                        <option value="B0">B0</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="Custom">Custom</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty (Sacks)</label>
                    <input 
                        type="number" required min="1"
                        value={form.quantity || ''}
                        onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                    <input 
                        type="number" required min="1"
                        value={form.rate || ''}
                        onChange={e => setForm({...form, rate: Number(e.target.value)})}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
            
            <button 
                type="submit" 
                className={`w-full text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2 font-medium ${error ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                disabled={!!error}
            >
                {editingId ? <Save size={18} /> : <Plus size={18} />} 
                {editingId ? 'Update Entry' : 'Add Entry'}
            </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex flex-col gap-3 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Feed Log</h3>
            <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search Bill No..." 
                        value={searchBill}
                        onChange={e => setSearchBill(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                </div>
                <button 
                    onClick={handleExportPDF}
                    disabled={displayItems.length === 0}
                    className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Download size={14} /> PDF
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Date</th>
                        <th className="px-4 py-3">Bill</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Act</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                         [...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b bg-white">
                                <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                                <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                                <td className="px-4 py-4"><Skeleton className="h-4 w-10" /></td>
                                <td className="px-4 py-4"><Skeleton className="h-4 w-8" /></td>
                                <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                                <td className="px-4 py-4"><Skeleton className="h-4 w-8" /></td>
                            </tr>
                        ))
                    ) : displayItems.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-4 text-center">No records found.</td></tr>
                    ) : (
                        displayItems.map(item => (
                            <tr key={item.id} className={`border-b hover:bg-gray-50 ${editingId === item.id ? 'bg-blue-50' : 'bg-white'}`}>
                                <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">{item.billNo}</td>
                                <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{item.type}</span></td>
                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                <td className="px-4 py-3 font-bold text-right text-xs">{(item.total || 0).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(item)} 
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Edit2 size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}