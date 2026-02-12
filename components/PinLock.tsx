import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Props {
  isSetup: boolean;
  storedHash: string | null;
  onSuccess: (hash: string) => void;
}

const PinLock: React.FC<Props> = ({ isSetup, storedHash, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>(isSetup ? 'enter' : 'create');
  const [error, setError] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
        setPin(prev => prev + digit);
        setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setError("PIN must be 4-6 digits");
      return;
    }

    // Simple hash for demo (in production use proper crypto)
    const hash = btoa(pin + "SALT_123");

    if (step === 'enter') {
      if (hash === storedHash) {
        onSuccess(hash);
      } else {
        setError("Incorrect PIN");
        setPin('');
      }
    } else if (step === 'create') {
      setConfirmPin(pin);
      setPin('');
      setStep('confirm');
      setError('');
    } else if (step === 'confirm') {
      const confirmHash = btoa(confirmPin + "SALT_123");
      if (hash === confirmHash) {
         onSuccess(hash);
      } else {
         setError("PINs do not match. Try again.");
         setStep('create');
         setPin('');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center text-white pb-safe overflow-hidden">
      {/* Main Content Area - Flexible height */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[340px] px-4 overflow-y-auto no-scrollbar">
          <div className="flex flex-col items-center mb-6 shrink-0 pt-4">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-blue-500/50">
              {isSetup ? <Lock size={24} /> : <Unlock size={24} />}
            </div>
            <h1 className="text-xl font-bold text-center">
              {step === 'enter' ? 'Enter PIN to Unlock' : 
               step === 'create' ? 'Create Security PIN' : 'Confirm New PIN'}
            </h1>
            <p className="text-gray-400 mt-1 text-xs">Poultry Manager Pro</p>
          </div>

          <div className="flex gap-4 mb-6 h-4 shrink-0">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full border-2 border-blue-500 transition-all duration-200
                  ${i < pin.length ? 'bg-blue-500 scale-110' : 'bg-transparent'}`}
              />
            ))}
          </div>

          {error && <div className="text-red-400 mb-4 text-sm font-medium animate-pulse shrink-0">{error}</div>}

          <div className="grid grid-cols-3 gap-4 w-full mb-6 shrink-0 place-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num}
                onClick={() => handleDigit(num.toString())}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-800 hover:bg-gray-700 text-2xl font-semibold transition-colors border border-gray-700 active:scale-95 shadow-lg flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <div className="w-16 h-16 sm:w-20 sm:h-20"></div>
            <button 
              onClick={() => handleDigit('0')}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-800 hover:bg-gray-700 text-2xl font-semibold transition-colors border border-gray-700 active:scale-95 shadow-lg flex items-center justify-center"
            >
              0
            </button>
            <button 
              onClick={handleBackspace}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-800 hover:bg-gray-700 text-xl font-semibold transition-colors border border-gray-700 flex items-center justify-center active:scale-95 text-red-400 shadow-lg"
            >
              ⌫
            </button>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 rounded-xl text-lg font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20 shrink-0 mb-4"
          >
            {step === 'enter' ? 'Unlock App' : step === 'create' ? 'Next Step' : 'Set PIN'}
          </button>
      </div>

      {/* Footer - Stays at bottom naturally via flex layout */}
      <div className="w-full text-center shrink-0 pb-6 pt-2">
        <p className="text-[10px] text-gray-500 tracking-wider font-medium mb-1">POWERED BY</p>
        <p className="text-sm font-bold text-blue-400 tracking-[0.2em] uppercase glow-text">
          DEVELOPED BY PRABIN BAN
        </p>
      </div>
      
      <style>{`
        .glow-text {
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default PinLock;