import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { db } from '../utils/db';
import { Lock, Mail, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onSkip: () => void;
}

export default function Auth({ onLogin, onSkip }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
        setError("Supabase is not configured. Please add keys in utils/supabase.ts");
        return;
    }
    if (!supabase) return;

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
            alert("Registration successful! You can now log in.");
            setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          db.saveUserSession(data.session);
          onLogin();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-500/30">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome to PMS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Secure Cloud Sync & Backup</p>
        </div>

        {!isSupabaseConfigured() && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 p-3 rounded-lg flex items-start gap-3 mb-6">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    <strong>Developer Note:</strong> Supabase API Keys are missing in <code>utils/supabase.ts</code>. Cloud features will not work until configured.
                </p>
            </div>
        )}

        {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm mb-6 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    placeholder="you@example.com"
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    placeholder="••••••••"
                    minLength={6}
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !isSupabaseConfigured()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
             <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
             >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
             </button>

             <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or</span></div>
             </div>

             <button 
                onClick={onSkip}
                className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
             >
                Continue as Guest (Offline Mode)
             </button>
        </div>
      </div>
    </div>
  );
}