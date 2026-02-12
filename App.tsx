import React, { useState, useEffect } from 'react';
import { db } from './utils/db';
import { View, AppSettings } from './types';
import PinLock from './components/PinLock';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FlockManager from './pages/FlockManager';
import FeedManager from './pages/FeedManager';
import ModuleManager from './pages/ModuleManager';
import GalleryManager from './pages/GalleryManager';
import ReportsManager from './pages/ReportsManager';
import VaccineManager from './pages/VaccineManager';

// Security Constants
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [settings, setSettings] = useState<AppSettings>({ pinHash: null, isSetup: false, darkMode: false, sackWeightKg: 50 });
  const [isLocked, setIsLocked] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [selectedFlockId, setSelectedFlockId] = useState<string>("");
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Initial Load
  useEffect(() => {
    const s = db.getSettings();
    setSettings(s);
    
    // If not setup, we lock to force setup flow (handled by PinLock component)
    // If setup, we start locked.
    setIsLocked(true);
  }, []);

  // Activity Monitor for Auto-Lock
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const interval = setInterval(() => {
      // Auto-lock should trigger if:
      // 1. App is not currently locked
      // 2. PIN setup is complete
      if (!isLocked && settings.isSetup) {
        if (Date.now() - lastActivity > LOCK_TIMEOUT_MS) {
          setIsLocked(true);
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(interval);
    };
  }, [isLocked, lastActivity, settings.isSetup]);

  const handleUnlock = () => {
    setIsLocked(false);
    setLastActivity(Date.now());
  };

  const handleLockApp = () => {
    setIsLocked(true);
  };

  if (isLocked) {
    return (
      <PinLock 
        isSetup={settings.isSetup} 
        storedHash={settings.pinHash}
        onSuccess={(hash) => {
            if (!settings.isSetup) {
                // Save new PIN
                const newSettings = { ...settings, pinHash: hash, isSetup: true };
                db.saveSettings(newSettings);
                setSettings(newSettings);
            }
            handleUnlock();
        }} 
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} onSelectFlock={setSelectedFlockId} />;
      case View.FLOCKS:
        return <FlockManager />;
      case View.FEED:
        return <FeedManager selectedFlockId={selectedFlockId} />;
      case View.MEDICINE:
        return <ModuleManager type="medicine" selectedFlockId={selectedFlockId} />;
      case View.EXPENSES:
        return <ModuleManager type="expense" selectedFlockId={selectedFlockId} />;
      case View.MORTALITY:
        return <ModuleManager type="mortality" selectedFlockId={selectedFlockId} />;
      case View.SALES:
        return <ModuleManager type="sales" selectedFlockId={selectedFlockId} />;
      case View.GALLERY:
        return <GalleryManager selectedFlockId={selectedFlockId} />;
      case View.REPORTS:
        return <ReportsManager selectedFlockId={selectedFlockId} />;
      case View.VACCINES:
        return <VaccineManager />;
      default:
        return <Dashboard onViewChange={setCurrentView} onSelectFlock={setSelectedFlockId} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView} 
      onLock={handleLockApp}
    >
      {renderView()}
    </Layout>
  );
}