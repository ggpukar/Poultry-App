import { createClient } from '@supabase/supabase-js';

// Use Environment Variables if available, otherwise fall back to provided keys (for demo purposes)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://xxcqcvcyeayfkwhhdcgi.supabase.co';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || 'sb_publishable_3rRmeAKdAjZhubq_Bq0hfQ_n49eNQBu';

export const supabase = (SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY !== 'sb_publishable_3rRmeAKdAjZhubq_Bq0hfQ_n49eNQBu') 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const isSupabaseConfigured = () => !!supabase;