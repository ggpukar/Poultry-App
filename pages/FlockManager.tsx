import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Flock } from '../types';
import NepaliDatePicker from '../components/NepaliDatePicker';
import Skeleton from '../components/Skeleton';
import { Plus, Trash2, Edit2, X, Calculator, CalendarClock, ChevronDown, Check, Bird } from 'lucide-react';
import { getDaysDiff, addDaysToBS } from '../utils/nepali';

export default function FlockManager() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalBirds, setTotalBirds] = useState('');
  const [rate, setRate] = useState('');
  const [status, setStatus] = useState<'active' | 'closed'>('active');

  const refresh = (withLoading = true) => {
      if(withLoading) setLoading(true);
      setTimeout(() => {
          setFlocks(db.getFlocks());
          if(withLoading) setLoading(false);
      }, withLoading ? 600 : 0);
  };

  useEffect(() => refresh(true), []);

  // Derived state for UI feedback
  const estimatedEndDate = startDate ? addDaysToBS(startDate, 45) : '';
  const estimatedCost = (Number(totalBirds) && Number(rate)) ? Number(totalBirds) * Number(rate) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto calculate End Date (45 days from start)
    const finalEndDate = estimatedEndDate;

    const flockData: Flock = {
      id: editingId || Date.now().toString(),
      name,
      startDate,
      endDate: finalEndDate,
      totalBirds: parseInt(totalBirds),
      status,
    };

    if (editingId) {
      db.updateFlock(flockData);
    } else {
      // Create Flock
      db.addFlock(flockData);

      // Create Initial Expense automatically
      if (estimatedCost > 0) {
          db.addExpense({
              id: Date.now().toString() + '_init_cost',
              flockId: flockData.id,
              date: startDate,
              name: 'Initial Chicks Purchase',
              quantity: parseInt(totalBirds),
              rate: Number(rate),
              total: estimatedCost
          });
      }
    }
    
    closeModal();
    refresh(false);
  };

  const handleEdit = (flock: Flock) => {
    setEditingId(flock.id);
    setName(flock.name);
    setStartDate(flock.startDate);
    setTotalBirds(flock.totalBirds.toString());
    setStatus(flock.status);
    setRate(''); // Reset rate on edit as it was converted to expense
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('Delete this flock and ALL associated data? This cannot be undone.')) {
        db.deleteFlock(id);
        refresh(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName('');
    setStartDate('');
    setTotalBirds('');
    setRate('');
  };

  // Helper for progress bar
  const getAgePercentage = (start: string) => {
      const age = getDaysDiff(start);
      const percent = (age / 45) * 100;
      return Math.min(Math.max(percent, 0), 100);
  };

  return (
    <div className="pb-24 relative min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Flock Management</h2>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
             [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between mb-3">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="space-y-3 mb-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            ))
        ) : flocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                <Bird size={48} className="mb-4 text-gray-300" />
                <p className="font-medium text-gray-500 dark:text-gray-400">No flocks found.</p>
                <p className="text-sm mt-1">Tap the + button to add one.</p>
            </div>
        ) : (
             flocks.map(flock => {
                const age = getDaysDiff(flock.startDate);
                const progress = getAgePercentage(flock.startDate);
                
                return (
                <div key={flock.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden transition-transform active:scale-[0.99]">
                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{flock.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <CalendarClock size={12}/>
                                <span>{flock.startDate}</span>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wide ${flock.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {flock.status}
                        </span>
                    </div>
                    
                    {/* Age Progress Bar */}
                    <div className="mb-5">
                         <div className="flex justify-between text-xs mb-2 font-medium">
                             <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Check size={12} className="text-blue-500"/> Day {age}
                             </span>
                             <span className="text-gray-400 dark:text-gray-500">Goal: 45 Days</span>
                         </div>
                         <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                style={{width: `${progress}%`}}
                             ></div>
                         </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                         <div className="text-sm">
                             <span className="text-gray-500 dark:text-gray-400">Total Birds: </span>
                             <span className="font-bold text-gray-900 dark:text-white text-base">{flock.totalBirds}</span>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleEdit(flock)} className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-xl transition-colors" title="Edit">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(flock.id)} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-xl transition-colors" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )})
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-5 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center z-30 transition-transform active:scale-90"
      >
        <Plus size={32} />
      </button>

      {/* Bottom Sheet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={closeModal}
            />
            
            {/* Sheet */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-1 cursor-pointer" onClick={closeModal}>
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-6 py-3 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {editingId ? 'Edit Flock' : 'New Flock'}
                     </h3>
                     <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-800 transition-colors">
                        <X size={20} />
                     </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto pb-safe">
                    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Flock Name</label>
                            <input 
                                required 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="w-full border-none bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-gray-400" 
                                placeholder="e.g. Lot 5 Broiler" 
                            />
                        </div>
                        
                        <div>
                            <NepaliDatePicker label="Start Date (BS)" value={startDate} onChange={setStartDate} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target End</label>
                                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-500 dark:text-gray-400 text-sm">
                                    {estimatedEndDate || '---'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                <div className="relative">
                                    <select 
                                        value={status} 
                                        onChange={(e:any) => setStatus(e.target.value)} 
                                        className="w-full appearance-none bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10 font-medium"
                                    >
                                        <option value="active">Active</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30 space-y-4">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                <Calculator size={18} /> Initial Stock Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Total Birds</label>
                                    <input 
                                        required 
                                        type="number" 
                                        min="1" 
                                        value={totalBirds} 
                                        onChange={e => setTotalBirds(e.target.value)} 
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold text-lg text-gray-800 dark:text-white" 
                                        placeholder="0" 
                                    />
                                </div>
                                
                                {!editingId && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Rate / Chick</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-gray-400 text-xs font-bold">Rs.</span>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                value={rate} 
                                                onChange={e => setRate(e.target.value)} 
                                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold text-lg text-gray-800 dark:text-white" 
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!editingId && estimatedCost > 0 && (
                                <div className="flex justify-between items-center text-sm pt-3 border-t border-blue-200 dark:border-blue-800/30">
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">Initial Expense:</span>
                                    <span className="font-bold text-blue-900 dark:text-blue-100 text-lg">Rs. {(estimatedCost || 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                            {editingId ? 'Save Changes' : 'Create Flock'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
