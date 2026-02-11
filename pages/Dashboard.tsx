import React, { useEffect, useState, useRef } from 'react';
import { db } from '../utils/db';
import { Flock, Vaccine } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { View } from '../types';
import { Bird, DollarSign, TrendingUp, AlertTriangle, Syringe, Activity, Settings, Skull, GripVertical, Layers, ChevronRight } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { getCurrentBS } from '../utils/nepali';

interface Props {
  onViewChange: (view: View) => void;
  onSelectFlock: (id: string) => void;
}

interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  subValue?: string;
  icon: any;
  colorClass: string; // Gradient class
}

const DEFAULT_WIDGET_ORDER = ['live_birds', 'mortality_today', 'fcr', 'profit', 'active_flocks', 'sales'];

const Dashboard: React.FC<Props> = ({ onViewChange, onSelectFlock }) => {
  const [loading, setLoading] = useState(true);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [upcomingVaccines, setUpcomingVaccines] = useState<Vaccine[]>([]);
  
  // Widget State
  const [widgetData, setWidgetData] = useState<Record<string, DashboardWidget>>({});
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_WIDGET_ORDER);
  const [dragMode, setDragMode] = useState(false);

  // Drag Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Stats for Charts
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    const savedOrder = localStorage.getItem('PMS_DASHBOARD_WIDGET_ORDER');
    if (savedOrder) {
      try {
        setWidgetOrder(JSON.parse(savedOrder));
      } catch (e) { console.error("Failed to load widget order"); }
    }
    setTimeout(() => {
        loadData();
    }, 800);
  }, []);

  const loadData = () => {
    const f = db.getFlocks();
    setFlocks(f);
    
    // Calculate global stats with safety checks (|| 0)
    const allFeed = db.getFeeds();
    const allMed = db.getMedicines();
    const allExp = db.getExpenses();
    const allSales = db.getSales();
    const allMort = db.getMortality();
    const allVaccines = db.getVaccines();

    const feedCost = allFeed.reduce((s, x) => s + (x.total || 0), 0);
    const medCost = allMed.reduce((s, x) => s + (x.total || 0), 0);
    const otherExp = allExp.reduce((s, x) => s + (x.total || 0), 0);
    const sales = allSales.reduce((s, x) => s + (x.total || 0), 0);
    
    const totalInitial = f.reduce((s, x) => s + (x.totalBirds || 0), 0);
    const totalDeath = allMort.reduce((s, x) => s + (x.count || 0), 0);
    const liveBirds = totalInitial - totalDeath;
    const netProfit = sales - (feedCost + medCost + otherExp);

    const todayBS = getCurrentBS();
    const todayMortality = allMort
        .filter(m => m.date === todayBS)
        .reduce((s, x) => s + (x.count || 0), 0);

    const activeFlocksCount = f.filter(x => x.status === 'active').length;
    
    const settings = db.getSettings();
    const totalFeedKg = allFeed.reduce((s, x) => s + ((x.quantity || 0) * (settings.sackWeightKg || 50)), 0);
    const totalSoldWeightKg = allSales.reduce((s, x) => s + (x.weightKg || 0), 0);
    const fcr = totalSoldWeightKg > 0 ? (totalFeedKg / totalSoldWeightKg).toFixed(2) : "0.00";

    const upcoming = allVaccines.filter(v => v.status === 'pending' && v.scheduledDate >= todayBS)
        .sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate))
        .slice(0, 3);

    setUpcomingVaccines(upcoming);

    const widgets: Record<string, DashboardWidget> = {
        live_birds: {
            id: 'live_birds',
            title: 'Live Birds',
            value: (liveBirds || 0).toLocaleString(),
            icon: Bird,
            colorClass: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
        },
        mortality_today: {
            id: 'mortality_today',
            title: "Today's Dead",
            value: (todayMortality || 0),
            subValue: 'Birds',
            icon: Skull,
            colorClass: 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
        },
        fcr: {
            id: 'fcr',
            title: 'Est. FCR',
            value: fcr,
            subValue: 'Target: 1.6',
            icon: Activity,
            colorClass: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
        },
        active_flocks: {
            id: 'active_flocks',
            title: 'Active Flocks',
            value: activeFlocksCount,
            icon: Layers,
            colorClass: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
        },
        sales: {
            id: 'sales',
            title: 'Total Sales',
            value: `Rs. ${(sales || 0).toLocaleString()}`,
            icon: TrendingUp,
            colorClass: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
        },
        profit: {
            id: 'profit',
            title: 'Net Profit',
            value: `Rs. ${(netProfit || 0).toLocaleString()}`,
            icon: netProfit >= 0 ? DollarSign : AlertTriangle,
            colorClass: netProfit >= 0 
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' 
                : 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
        }
    };

    setWidgetData(widgets);
    setChartData([
        { name: 'Feed', value: feedCost },
        { name: 'Med', value: medCost },
        { name: 'Exp', value: otherExp },
    ]);
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent<any>, position: number) => {
    dragItem.current = position;
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent<any>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = (e: React.DragEvent<any>) => {
    e.currentTarget.classList.remove('opacity-50');
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const copyList = [...widgetOrder];
    const dragContent = copyList[dragItem.current];
    copyList.splice(dragItem.current, 1);
    copyList.splice(dragOverItem.current, 0, dragContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setWidgetOrder(copyList);
    localStorage.setItem('PMS_DASHBOARD_WIDGET_ORDER', JSON.stringify(copyList));
  };
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  if (loading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Farm Overview</h2>
        <button 
            onClick={() => setDragMode(!dragMode)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${dragMode ? 'bg-blue-600 text-white' : 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}
        >
            <Settings size={14} />
            {dragMode ? 'Done' : 'Customize'}
        </button>
      </div>

      {/* Vaccine Alert */}
      {upcomingVaccines.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-4">
              <h3 className="text-amber-800 dark:text-amber-400 font-semibold text-sm flex items-center gap-2 mb-3">
                  <Syringe size={16} /> Vaccination Alert
              </h3>
              <div className="flex flex-col gap-2">
                  {upcomingVaccines.map(v => (
                      <div key={v.id} onClick={() => onViewChange(View.VACCINES)} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-amber-100 dark:border-gray-700 flex justify-between items-center active:scale-95 transition-transform cursor-pointer">
                          <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{v.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Due: {v.scheduledDate}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Modern Gradient Widgets */}
      <div className="grid grid-cols-2 gap-3">
        {widgetOrder.map((widgetId, index) => {
            const widget = widgetData[widgetId];
            if (!widget) return null;
            return (
                <div 
                    key={widget.id}
                    draggable={dragMode}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`relative overflow-hidden p-4 rounded-2xl shadow-md transition-all ${widget.colorClass}
                        ${dragMode ? 'cursor-move opacity-90 scale-95 ring-2 ring-blue-400' : ''}
                    `}
                >
                    {/* Decorative Background Icon */}
                    <widget.icon className="absolute -right-2 -bottom-2 text-white/20" size={56} />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                             <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider">{widget.title}</span>
                             {dragMode && <GripVertical size={16} className="text-white/80" />}
                        </div>
                        <p className={`text-lg font-bold mt-1 text-white truncate`}>{widget.value}</p>
                        {widget.subValue && (
                            <p className="text-[10px] text-white/80 mt-0.5">{widget.subValue}</p>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 gap-5">
         <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Expense Breakdown</h3>
            <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value) => `Rs. ${(Number(value) || 0).toLocaleString()}`} 
                            contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs font-medium dark:text-gray-300">
                {chartData.map((e, i) => (
                    <div key={e.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                        <span>{e.name}</span>
                    </div>
                ))}
            </div>
         </div>

         <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-gray-800 dark:text-white">Active Flocks</h3>
                 <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{flocks.length} total</span>
            </div>
            
            <div className="space-y-3">
                {flocks.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-sm">No active flocks.</div>
                ) : (
                    flocks.map(flock => (
                        <div key={flock.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl flex justify-between items-center cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                            onClick={() => {
                                onSelectFlock(flock.id);
                                onViewChange(View.FEED);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <Bird size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{flock.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Start: {flock.startDate}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${flock.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-600'}`}>
                                    {flock.status}
                                </span>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{flock.totalBirds}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;