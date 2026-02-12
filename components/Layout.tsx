import React, { useState, useEffect } from 'react';
import { View } from '../types';
import NepaliDate from 'nepali-date-converter';
import { Menu, X, LayoutDashboard, Bird, Cookie, Pill, DollarSign, Skull, ShoppingCart, Image, FileText, Lock, Syringe, Moon, Sun, Save } from 'lucide-react';
import { formatTime } from '../utils/nepali';
import { db } from '../utils/db';

interface Props {
  children: React.ReactNode;
  currentView: View;
  onChangeView: (view: View) => void;
  onLock: () => void;
}

const Layout: React.FC<Props> = ({ children, currentView, onChangeView, onLock }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(db.getSettings().darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const settings = db.getSettings();
    db.saveSettings({ ...settings, darkMode: newMode });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nepaliDateStr = new NepaliDate(currentDateTime).format('YYYY-MM-DD');
  const timeStr = formatTime(currentDateTime);

  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.FLOCKS, label: 'Flocks', icon: Bird },
    { id: View.FEED, label: 'Feed', icon: Cookie },
    { id: View.VACCINES, label: 'Vaccines', icon: Syringe },
    { id: View.MEDICINE, label: 'Medicine', icon: Pill },
    { id: View.EXPENSES, label: 'Expenses', icon: DollarSign },
    { id: View.MORTALITY, label: 'Mortality', icon: Skull },
    { id: View.SALES, label: 'Sales', icon: ShoppingCart },
    { id: View.GALLERY, label: 'Gallery', icon: Image },
    { id: View.REPORTS, label: 'Reports', icon: FileText },
  ];

  // Mobile Bottom Nav items (Subset)
  const mobileNavItems = [
    { id: View.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: View.FEED, label: 'Feed', icon: Cookie },
    { id: View.VACCINES, label: 'Vax', icon: Syringe },
    { id: View.MORTALITY, label: 'Dead', icon: Skull },
    { id: View.FLOCKS, label: 'Flocks', icon: Bird },
  ];

  const handleBackup = () => {
    const data = db.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pms_backup_${nepaliDateStr}.json`;
    a.click();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden font-sans">
      {/* Mobile Drawer Sidebar */}
      <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl pt-safe`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700 bg-slate-900/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-blue-400">Poultry Pro</h1>
          <button onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)] no-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                setSidebarOpen(false);
              }}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              <item.icon size={20} className="mr-3" />
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="pt-4 border-t border-gray-700 mt-4 space-y-2">
            <button onClick={handleBackup} className="flex items-center w-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">
               <Save size={16} className="mr-3" /> Backup JSON
            </button>
            <button 
                onClick={onLock}
                className="flex items-center w-full px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 transition-colors"
            >
                <Lock size={20} className="mr-3" />
                <span>Lock App</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Glassmorphic Header - Fixed with Safe Area */}
        <header className="absolute top-0 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 transition-colors pt-safe">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
               <Menu size={24} />
             </button>
             <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate max-w-[150px]">
                 {navItems.find(i => i.id === currentView)?.label}
             </h2>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Clock Section */}
            <div className="flex flex-col items-end">
                <div className="text-xs font-bold flex flex-col items-end leading-tight">
                  <span className="text-blue-600 dark:text-blue-400 whitespace-nowrap">{nepaliDateStr}</span>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap text-[10px]">{timeStr}</span>
                </div>
            </div>
          </div>
        </header>

        {/* Content Body with Padding for Header/Nav and Safe Area */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors pb-[85px]" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 65px)' }}>
          <div key={currentView} className="animate-slide-up p-4">
            {children}
          </div>
        </div>

        {/* Glassmorphic Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 flex justify-around p-2 z-40 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
            {mobileNavItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onChangeView(item.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl w-full transition-all duration-200 active:scale-95 ${currentView === item.id ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    <div className={`mb-1 transition-all ${currentView === item.id ? '-translate-y-0.5' : ''}`}>
                      <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-medium ${currentView === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
                </button>
            ))}
        </div>
      </main>
    </div>
  );
};

export default Layout;