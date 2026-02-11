import { Flock, Feed, Medicine, Expense, Mortality, Sale, GalleryItem, AppSettings, Vaccine } from '../types';
import { addDaysToBS } from './nepali';
import { supabase } from './supabase';

// Keys for LocalStorage
const K_FLOCKS = 'PMS_FLOCKS';
const K_FEED = 'PMS_FEED';
const K_MEDICINE = 'PMS_MEDICINE';
const K_EXPENSES = 'PMS_EXPENSES';
const K_MORTALITY = 'PMS_MORTALITY';
const K_SALES = 'PMS_SALES';
const K_GALLERY = 'PMS_GALLERY';
const K_SETTINGS = 'PMS_SETTINGS';
const K_VACCINES = 'PMS_VACCINES';
const K_USER_SESSION = 'PMS_USER_SESSION';

// Generic helper to get data
const getList = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Generic helper to save data
const saveList = <T>(key: string, list: T[]) => {
  localStorage.setItem(key, JSON.stringify(list));
};

export const db = {
  // --- AUTHENTICATION ---
  getUserSession: () => {
    const sess = localStorage.getItem(K_USER_SESSION);
    return sess ? JSON.parse(sess) : null;
  },
  saveUserSession: (session: any) => {
    if (session) localStorage.setItem(K_USER_SESSION, JSON.stringify(session));
    else localStorage.removeItem(K_USER_SESSION);
  },
  logout: async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(K_USER_SESSION);
  },

  // --- CLOUD SYNC ---
  uploadToCloud: async (userId: string) => {
    if (!supabase) throw new Error("Cloud not configured");
    
    // Create a full snapshot
    const snapshot = {
      flocks: getList(K_FLOCKS),
      feed: getList(K_FEED),
      medicine: getList(K_MEDICINE),
      expenses: getList(K_EXPENSES),
      mortality: getList(K_MORTALITY),
      sales: getList(K_SALES),
      vaccines: getList(K_VACCINES),
      gallery: getList(K_GALLERY),
      settings: db.getSettings(),
      updated_at: new Date().toISOString()
    };

    // Upsert into a 'backups' table
    // Table Schema required in Supabase:
    // table: user_backups
    // columns: user_id (uuid, PK), data (jsonb), updated_at (timestamp)
    const { error } = await supabase
      .from('user_backups')
      .upsert({ user_id: userId, data: snapshot, updated_at: new Date().toISOString() });

    if (error) throw error;
    return true;
  },

  downloadFromCloud: async (userId: string) => {
    if (!supabase) throw new Error("Cloud not configured");

    const { data, error } = await supabase
      .from('user_backups')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (data && data.data) {
      db.importData(JSON.stringify(data.data));
      return true;
    }
    return false;
  },

  // Settings / Auth
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(K_SETTINGS);
    const defaults: AppSettings = { pinHash: null, isSetup: false, darkMode: false, sackWeightKg: 50 };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
  },

  // Flocks
  getFlocks: (): Flock[] => getList<Flock>(K_FLOCKS),
  addFlock: (flock: Flock) => {
    const list = getList<Flock>(K_FLOCKS);
    list.push(flock);
    saveList(K_FLOCKS, list);
    
    // Auto-generate vaccine schedule
    const vaccines = [
      { day: 1, name: 'Marek (F1)' },
      { day: 7, name: 'Newcastle (F1)' },
      { day: 14, name: 'Gumboro (IBD)' },
      { day: 21, name: 'Newcastle (Booster)' },
      { day: 28, name: 'Gumboro (Booster)' }
    ];

    const vaccineList = getList<Vaccine>(K_VACCINES);
    vaccines.forEach(v => {
      vaccineList.push({
        id: Date.now() + Math.random().toString(),
        flockId: flock.id,
        name: v.name,
        scheduledDate: addDaysToBS(flock.startDate, v.day),
        status: 'pending'
      });
    });
    saveList(K_VACCINES, vaccineList);
  },
  updateFlock: (flock: Flock) => {
    const list = getList<Flock>(K_FLOCKS);
    const idx = list.findIndex(f => f.id === flock.id);
    if (idx !== -1) {
      list[idx] = flock;
      saveList(K_FLOCKS, list);
    }
  },
  deleteFlock: (id: string) => {
    // Cascade delete
    saveList(K_FLOCKS, getList<Flock>(K_FLOCKS).filter(f => f.id !== id));
    saveList(K_FEED, getList<Feed>(K_FEED).filter(x => x.flockId !== id));
    saveList(K_MEDICINE, getList<Medicine>(K_MEDICINE).filter(x => x.flockId !== id));
    saveList(K_EXPENSES, getList<Expense>(K_EXPENSES).filter(x => x.flockId !== id));
    saveList(K_MORTALITY, getList<Mortality>(K_MORTALITY).filter(x => x.flockId !== id));
    saveList(K_SALES, getList<Sale>(K_SALES).filter(x => x.flockId !== id));
    saveList(K_GALLERY, getList<GalleryItem>(K_GALLERY).filter(x => x.flockId !== id));
    saveList(K_VACCINES, getList<Vaccine>(K_VACCINES).filter(x => x.flockId !== id));
  },

  // Feed
  getFeeds: (flockId?: string): Feed[] => {
    const list = getList<Feed>(K_FEED);
    return flockId ? list.filter(f => f.flockId === flockId) : list;
  },
  addFeed: (item: Feed): { success: boolean, error?: string } => {
    const list = getList<Feed>(K_FEED);
    if (list.some(f => f.billNo === item.billNo)) {
      return { success: false, error: 'Bill Number must be UNIQUE.' };
    }
    list.push(item);
    saveList(K_FEED, list);
    return { success: true };
  },
  updateFeed: (item: Feed) => {
    const list = getList<Feed>(K_FEED);
    const idx = list.findIndex(f => f.id === item.id);
    if (list.some(f => f.billNo === item.billNo && f.id !== item.id)) {
        throw new Error("Duplicate Bill No");
    }
    if (idx !== -1) {
      list[idx] = item;
      saveList(K_FEED, list);
    }
  },
  deleteFeed: (id: string) => {
    const list = getList<Feed>(K_FEED).filter(f => f.id !== id);
    saveList(K_FEED, list);
  },

  // Generic CRUD helpers
  getMedicines: (flockId?: string) => flockId ? getList<Medicine>(K_MEDICINE).filter(x => x.flockId === flockId) : getList<Medicine>(K_MEDICINE),
  addMedicine: (item: Medicine) => saveList(K_MEDICINE, [...getList<Medicine>(K_MEDICINE), item]),
  deleteMedicine: (id: string) => saveList(K_MEDICINE, getList<Medicine>(K_MEDICINE).filter(x => x.id !== id)),

  getExpenses: (flockId?: string) => flockId ? getList<Expense>(K_EXPENSES).filter(x => x.flockId === flockId) : getList<Expense>(K_EXPENSES),
  addExpense: (item: Expense) => saveList(K_EXPENSES, [...getList<Expense>(K_EXPENSES), item]),
  deleteExpense: (id: string) => saveList(K_EXPENSES, getList<Expense>(K_EXPENSES).filter(x => x.id !== id)),

  getMortality: (flockId?: string) => flockId ? getList<Mortality>(K_MORTALITY).filter(x => x.flockId === flockId) : getList<Mortality>(K_MORTALITY),
  addMortality: (item: Mortality) => saveList(K_MORTALITY, [...getList<Mortality>(K_MORTALITY), item]),
  deleteMortality: (id: string) => saveList(K_MORTALITY, getList<Mortality>(K_MORTALITY).filter(x => x.id !== id)),

  getSales: (flockId?: string) => flockId ? getList<Sale>(K_SALES).filter(x => x.flockId === flockId) : getList<Sale>(K_SALES),
  addSale: (item: Sale) => saveList(K_SALES, [...getList<Sale>(K_SALES), item]),
  deleteSale: (id: string) => saveList(K_SALES, getList<Sale>(K_SALES).filter(x => x.id !== id)),

  getGallery: (flockId?: string) => flockId ? getList<GalleryItem>(K_GALLERY).filter(x => x.flockId === flockId) : getList<GalleryItem>(K_GALLERY),
  addGalleryItem: (item: GalleryItem) => saveList(K_GALLERY, [...getList<GalleryItem>(K_GALLERY), item]),
  deleteGalleryItem: (id: string) => saveList(K_GALLERY, getList<GalleryItem>(K_GALLERY).filter(x => String(x.id) !== String(id))),

  // Vaccines
  getVaccines: (flockId?: string) => flockId ? getList<Vaccine>(K_VACCINES).filter(x => x.flockId === flockId) : getList<Vaccine>(K_VACCINES),
  updateVaccine: (vaccine: Vaccine) => {
    const list = getList<Vaccine>(K_VACCINES);
    const idx = list.findIndex(v => v.id === vaccine.id);
    if (idx !== -1) {
      list[idx] = vaccine;
      saveList(K_VACCINES, list);
    }
  },

  // Backup & Restore
  exportData: () => {
    return JSON.stringify({
      flocks: getList(K_FLOCKS),
      feed: getList(K_FEED),
      medicine: getList(K_MEDICINE),
      expenses: getList(K_EXPENSES),
      mortality: getList(K_MORTALITY),
      sales: getList(K_SALES),
      vaccines: getList(K_VACCINES),
      gallery: getList(K_GALLERY),
      settings: localStorage.getItem(K_SETTINGS) ? JSON.parse(localStorage.getItem(K_SETTINGS)!) : null
    });
  },
  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if(data.flocks) saveList(K_FLOCKS, data.flocks);
      if(data.feed) saveList(K_FEED, data.feed);
      if(data.medicine) saveList(K_MEDICINE, data.medicine);
      if(data.expenses) saveList(K_EXPENSES, data.expenses);
      if(data.mortality) saveList(K_MORTALITY, data.mortality);
      if(data.sales) saveList(K_SALES, data.sales);
      if(data.vaccines) saveList(K_VACCINES, data.vaccines);
      if(data.gallery) saveList(K_GALLERY, data.gallery);
      if(data.settings) localStorage.setItem(K_SETTINGS, JSON.stringify(data.settings));
      return true;
    } catch(e) {
      console.error(e);
      return false;
    }
  }
};