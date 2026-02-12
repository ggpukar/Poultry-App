import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Flock } from '../types';
import NepaliDatePicker from '../components/NepaliDatePicker';
import Skeleton from '../components/Skeleton';
import { Trash2, AlertCircle, ChevronDown, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  type: 'medicine' | 'expense' | 'mortality' | 'sales';
  selectedFlockId: string;
}

export default function ModuleManager({ type, selectedFlockId }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [currentFlock, setCurrentFlock] = useState(selectedFlockId || '');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Generic Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState('');
  const [count, setCount] = useState(''); // for mortality
  const [weight, setWeight] = useState(''); // for sales

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
        setFlocks(db.getFlocks());
        refreshItems(false); // pass false to not trigger another loading
        setLoading(false);
    }, 600);
  }, [type, currentFlock]);

  useEffect(() => {
      if(selectedFlockId) setCurrentFlock(selectedFlockId);
  }, [selectedFlockId]);

  const refreshItems = (withLoading = false) => {
    if (withLoading) setLoading(true);
    
    // Simulate delay if withLoading is true, otherwise immediate
    const fetchData = () => {
        if (type === 'medicine') setItems(db.getMedicines(currentFlock));
        else if (type === 'expense') setItems(db.getExpenses(currentFlock));
        else if (type === 'mortality') setItems(db.getMortality(currentFlock));
        else if (type === 'sales') setItems(db.getSales(currentFlock));
        if(withLoading) setLoading(false);
    };

    if(withLoading) setTimeout(fetchData, 600);
    else fetchData();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFlock || !date) return alert("Flock and Date required");

    const id = Date.now().toString();
    const flockId = currentFlock;

    if (type === 'medicine') {
        db.addMedicine({ id, flockId, date, name, quantity: Number(quantity), rate: Number(rate), total: Number(quantity)*Number(rate) });
    } else if (type === 'expense') {
        db.addExpense({ id, flockId, date, name, quantity: Number(quantity), rate: Number(rate), total: Number(quantity)*Number(rate) });
    } else if (type === 'sales') {
        db.addSale({ id, flockId, date, weightKg: Number(weight), quantity: Number(quantity), rate: Number(rate), total: Number(weight)*Number(rate) });
    } else if (type === 'mortality') {
        // Validate negative
        const flock = flocks.find(f => f.id === currentFlock);
        const currentDeaths = db.getMortality(currentFlock).reduce((s, x) => s + x.count, 0);
        const remaining = (flock?.totalBirds || 0) - currentDeaths;
        
        if (Number(count) > remaining) {
            alert(`Cannot exceed remaining birds (${remaining})`);
            return;
        }
        db.addMortality({ id, flockId, date, count: Number(count), remarks: name });
    }

    // Reset fields
    setName(''); setQuantity(''); setRate(''); setCount(''); setWeight('');
    refreshItems();
  };

  const handleDelete = (id: string) => {
      if (!confirm("Delete this entry?")) return;
      if (type === 'medicine') db.deleteMedicine(id);
      else if (type === 'expense') db.deleteExpense(id);
      else if (type === 'mortality') db.deleteMortality(id);
      else if (type === 'sales') db.deleteSale(id);
      refreshItems();
  };

  const getTitle = () => {
      switch(type) {
          case 'medicine': return 'Medicine & Vaccines';
          case 'expense': return 'Miscellaneous Expenses';
          case 'mortality': return 'Death / Mortality Log';
          case 'sales': return 'Sales Record';
      }
  };

  const handleExportPDF = () => {
      const doc = new jsPDF();
      const flockName = flocks.find(f => f.id === currentFlock)?.name || 'All Flocks';
      const title = getTitle();

      // Header
      doc.setFontSize(18);
      doc.text(`${title} - ${flockName}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

      let head: string[] = [];
      let body: any[] = [];
      let themeColor: [number, number, number] = [100, 100, 100];
      let foot: string[] = [];

      if (type === 'medicine') {
          head = ['Date', 'Name/Description', 'Qty', 'Rate', 'Total'];
          body = items.map(i => [i.date, i.name, i.quantity, i.rate, (i.total || 0).toLocaleString()]);
          themeColor = [16, 185, 129]; // Green
          const total = items.reduce((s, x) => s + (x.total || 0), 0);
          foot = ['', '', '', 'Total:', `Rs. ${total.toLocaleString()}`];
      } else if (type === 'expense') {
          head = ['Date', 'Description', 'Qty', 'Rate', 'Total'];
          body = items.map(i => [i.date, i.name, i.quantity, i.rate, (i.total || 0).toLocaleString()]);
          themeColor = [245, 158, 11]; // Orange
          const total = items.reduce((s, x) => s + (x.total || 0), 0);
          foot = ['', '', '', 'Total:', `Rs. ${total.toLocaleString()}`];
      } else if (type === 'sales') {
          head = ['Date', 'Qty (Birds)', 'Weight (Kg)', 'Rate', 'Total'];
          body = items.map(i => [i.date, i.quantity, i.weightKg, i.rate, (i.total || 0).toLocaleString()]);
          themeColor = [124, 58, 237]; // Purple
          const total = items.reduce((s, x) => s + (x.total || 0), 0);
          foot = ['', '', '', 'Revenue:', `Rs. ${total.toLocaleString()}`];
      } else if (type === 'mortality') {
          head = ['Date', 'Count', 'Cause / Remarks'];
          body = items.map(i => [i.date, i.count, i.remarks || '-']);
          themeColor = [239, 68, 68]; // Red
          const total = items.reduce((s, x) => s + (x.count || 0), 0);
          foot = ['Total Dead:', total.toString(), ''];
      }

      autoTable(doc, {
          startY: 35,
          head: [head],
          body: body,
          theme: 'striped',
          headStyles: { fillColor: themeColor },
          foot: [foot],
          footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
      });

      const filename = `${type}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
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

  const colCount = type === 'mortality' ? 4 : 5;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            {type === 'mortality' && <AlertCircle className="text-red-500" />}
            {getTitle()}
        </h2>
        
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Flock</label>
                <div className="relative">
                    <select 
                        value={currentFlock} 
                        onChange={e => setCurrentFlock(e.target.value)}
                        className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 cursor-pointer transition-colors"
                        required
                    >
                        <option value="">-- Select Flock --</option>
                        {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDown size={16} />
                    </div>
                </div>
             </div>
             <div>
                <NepaliDatePicker label="Date (BS)" value={date} onChange={setDate} />
             </div>

             {/* Dynamic Fields based on Type */}
             {type !== 'mortality' && type !== 'sales' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <input required className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Vitamin C" />
                 </div>
             )}

             {type === 'mortality' && (
                 <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Deaths</label>
                        <input type="number" min="1" required className="w-full border rounded-lg px-3 py-2" value={count} onChange={e=>setCount(e.target.value)} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cause/Remarks (Optional)</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
                    </div>
                 </>
             )}

             {type === 'sales' && (
                 <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">No. of Birds</label>
                        <input type="number" required className="w-full border rounded-lg px-3 py-2" value={quantity} onChange={e=>setQuantity(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight (Kg)</label>
                        <input type="number" required className="w-full border rounded-lg px-3 py-2" value={weight} onChange={e=>setWeight(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate (per Kg)</label>
                        <input type="number" required className="w-full border rounded-lg px-3 py-2" value={rate} onChange={e=>setRate(e.target.value)} />
                    </div>
                 </>
             )}

             {(type === 'medicine' || type === 'expense') && (
                 <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input type="number" required className="w-full border rounded-lg px-3 py-2" value={quantity} onChange={e=>setQuantity(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                        <input type="number" required className="w-full border rounded-lg px-3 py-2" value={rate} onChange={e=>setRate(e.target.value)} />
                    </div>
                 </>
             )}

             <button className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 mt-2">Add Entry</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Records Log</h3>
              <button 
                onClick={handleExportPDF}
                disabled={items.length === 0}
                className="flex items-center gap-1 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <Download size={14} /> PDF
              </button>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold">
                  <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Date</th>
                      <th className="px-4 py-3">{type === 'mortality' ? 'Remarks' : 'Desc'}</th>
                      <th className="px-4 py-3 text-right">{type === 'mortality' ? 'Count' : (type === 'sales' ? 'Kg' : 'Qty')}</th>
                      {type !== 'mortality' && <th className="px-4 py-3 text-right">Total</th>}
                      <th className="px-4 py-3 text-center">Act</th>
                  </tr>
              </thead>
              <tbody>
                  {loading ? (
                       [...Array(5)].map((_, i) => (
                           <tr key={i} className="border-b bg-white">
                               <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                               <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                               <td className="px-4 py-3"><Skeleton className="h-4 w-8 ml-auto" /></td>
                               {type !== 'mortality' && <td className="px-4 py-3"><Skeleton className="h-4 w-12 ml-auto" /></td>}
                               <td className="px-4 py-3 flex justify-center"><Skeleton className="h-4 w-4" /></td>
                           </tr>
                       ))
                  ) : items.length === 0 ? (
                      <tr><td colSpan={colCount} className="px-4 py-8 text-center text-gray-500">No entries yet.</td></tr> 
                  ) : (
                      items.map(item => {
                        const displayDesc = type === 'mortality' ? (item.remarks || '-') : (item.name || (item.weightKg ? `${item.quantity} Birds` : '-'));
                        const displayQty = type === 'mortality' ? item.count : (type === 'sales' ? item.weightKg : item.quantity);
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                              <td className="px-4 py-3 truncate max-w-[100px]">{displayDesc}</td>
                              <td className="px-4 py-3 text-right font-medium">{displayQty}</td>
                              {type !== 'mortality' && <td className="px-4 py-3 text-right font-bold text-gray-800 text-xs">{(item.total || 0).toLocaleString()}</td>}
                              <td className="px-4 py-3 text-center">
                                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                              </td>
                          </tr>
                        );
                      })
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
}