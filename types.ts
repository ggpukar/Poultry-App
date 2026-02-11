export interface Flock {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD (BS)
  endDate?: string;  // YYYY-MM-DD (BS)
  totalBirds: number;
  status: 'active' | 'closed';
  notes?: string;
}

export interface Feed {
  id: string;
  flockId: string;
  billNo: string; // Unique
  date: string; // BS
  type: 'B0' | 'B1' | 'B2' | 'Custom';
  quantity: number;
  rate: number;
  total: number;
}

export interface Medicine {
  id: string;
  flockId: string;
  date: string; // BS
  name: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface Expense {
  id: string;
  flockId: string;
  date: string; // BS
  name: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface Mortality {
  id: string;
  flockId: string;
  date: string; // BS
  count: number;
  remarks?: string;
}

export interface Sale {
  id: string;
  flockId: string;
  date: string; // BS
  weightKg: number;
  quantity: number;
  rate: number;
  total: number;
}

export interface GalleryItem {
  id: string;
  flockId: string;
  imageData: string; // Base64
  date: string;
  caption?: string;
}

export interface Vaccine {
  id: string;
  flockId: string;
  name: string;
  scheduledDate: string; // BS
  status: 'pending' | 'completed' | 'missed';
  notes?: string;
}

export interface AppSettings {
  pinHash: string | null;
  isSetup: boolean;
  darkMode: boolean;
  sackWeightKg: number; // Default 50kg
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  FLOCKS = 'FLOCKS',
  FEED = 'FEED',
  MEDICINE = 'MEDICINE',
  EXPENSES = 'EXPENSES',
  MORTALITY = 'MORTALITY',
  SALES = 'SALES',
  GALLERY = 'GALLERY',
  REPORTS = 'REPORTS',
  VACCINES = 'VACCINES',
  SETTINGS = 'SETTINGS'
}