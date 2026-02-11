import { createClient } from '@supabase/supabase-js';

// NOTE: In a real production build, these should be in environment variables (import.meta.env.VITE_...)
// For this demo, we check if they exist, otherwise we return null to prevent crashes.
// You must create a project at https://supabase.com to get these keys.

const SUPABASE_URL = 'https://xxcqcvcyeayfkwhhdcgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3rRmeAKdAjZhubq_Bq0hfQ_n49eNQBu';

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const isSupabaseConfigured = () => !!supabase;