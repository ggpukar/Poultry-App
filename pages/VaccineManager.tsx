import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Vaccine, Flock } from '../types';
import NepaliDatePicker from '../components/NepaliDatePicker';
import Skeleton from '../components/Skeleton';
import { CheckCircle, Circle, AlertCircle, Calendar } from 'lucide-react';
import { getDaysDiff } from '../utils/nepali';

export default function VaccineManager() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [selectedFlock, setSelectedFlock] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
        setFlocks(db.getFlocks());
        setVaccines(db.getVaccines());
        setLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
      // Auto select first active flock
      if (flocks.length > 0 && !selectedFlock) {
          const active = flocks.find(f => f.status === 'active');
          if (active) setSelectedFlock(active.id);
          else setSelectedFlock(flocks[0].id);
      }
  }, [flocks]);

  const toggleStatus = (v: Vaccine) => {
    const newStatus = v.status === 'completed' ? 'pending' : 'completed';
    const updated = { ...v, status: newStatus as any };
    db.updateVaccine(updated);
    setVaccines(db.getVaccines()); // Refresh
  };

  const filteredVaccines = vaccines
    .filter(v => v.flockId === selectedFlock)
    .sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const currentFlockData = flocks.find(f => f.id === selectedFlock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <Calendar className="text-blue-600" /> Vaccination Schedule
          </h2>
          
          <select 
            value={selectedFlock}
            onChange={e => setSelectedFlock(e.target.value)}
            className="w-full md:w-64 p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          >
              {flocks.map(f => <option key={f.id} value={f.id}>{f.name} ({f.status})</option>)}
          </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {currentFlockData && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                      Flock Started: <span className="font-bold">{currentFlockData.startDate}</span> • 
                      Current Age: <span className="font-bold">{getDaysDiff(currentFlockData.startDate)} Days</span>
                  </p>
              </div>
          )}

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                  [...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <Skeleton className="h-7 w-7 rounded-full" />
                              <div className="space-y-2">
                                  <Skeleton className="h-5 w-32" />
                                  <Skeleton className="h-3 w-24" />
                              </div>
                          </div>
                          <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                  ))
              ) : filteredVaccines.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No vaccination schedule found for this flock.
                  </div>
              ) : (
                  filteredVaccines.map(v => {
                      const isOverdue = v.status === 'pending' && v.scheduledDate < new Date().toISOString().split('T')[0]; // Simple comparison
                      
                      return (
                          <div key={v.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${v.status === 'completed' ? 'opacity-75' : ''}`}>
                              <div className="flex items-center gap-4">
                                  <button onClick={() => toggleStatus(v)} className={`transition-colors ${v.status === 'completed' ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-green-500'}`}>
                                      {v.status === 'completed' ? <CheckCircle size={28} /> : <Circle size={28} />}
                                  </button>
                                  
                                  <div>
                                      <h4 className={`font-semibold text-lg ${v.status === 'completed' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-white'}`}>
                                          {v.name}
                                      </h4>
                                      <div className="flex items-center gap-2 text-sm">
                                          <span className={`${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                              {v.scheduledDate}
                                          </span>
                                          {isOverdue && (
                                              <span className="flex items-center gap-1 text-red-500 text-xs bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-800">
                                                  <AlertCircle size={12} /> Overdue
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="text-right">
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                      v.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}>
                                      {v.status.toUpperCase()}
                                  </span>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      </div>
    </div>
  );
}