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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
          {isSetup ? <Lock size={32} /> : <Unlock size={32} />}
        </div>
        <h1 className="text-2xl font-bold">
          {step === 'enter' ? 'Enter PIN to Unlock' : 
           step === 'create' ? 'Create New Security PIN' : 'Confirm New PIN'}
        </h1>
        <p className="text-gray-400 mt-2">Poultry Manager Pro</p>
      </div>

      <div className="flex gap-4 mb-8 h-8">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 border-blue-500 transition-all duration-200
              ${i < pin.length ? 'bg-blue-500 scale-110' : 'bg-transparent'}`}
          />
        ))}
      </div>

      {error && <div className="text-red-400 mb-6 font-medium animate-pulse">{error}</div>}

      <div className="grid grid-cols-3 gap-6 w-full max-w-[300px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num}
            onClick={() => handleDigit(num.toString())}
            className="w-20 h-20 rounded-full bg-gray-800 hover:bg-gray-700 text-2xl font-semibold transition-colors border border-gray-700 active:scale-95"
          >
            {num}
          </button>
        ))}
        <div className="w-20 h-20"></div>
        <button 
          onClick={() => handleDigit('0')}
          className="w-20 h-20 rounded-full bg-gray-800 hover:bg-gray-700 text-2xl font-semibold transition-colors border border-gray-700 active:scale-95"
        >
          0
        </button>
        <button 
          onClick={handleBackspace}
          className="w-20 h-20 rounded-full bg-gray-800 hover:bg-gray-700 text-xl font-semibold transition-colors border border-gray-700 flex items-center justify-center active:scale-95 text-red-400"
        >
          ⌫
        </button>
      </div>

      <button 
        onClick={handleSubmit}
        className="mt-8 w-full max-w-[300px] bg-blue-600 hover:bg-blue-700 py-4 rounded-xl text-lg font-bold transition-all active:scale-95"
      >
        {step === 'enter' ? 'Unlock' : step === 'create' ? 'Next' : 'Set PIN'}
      </button>
    </div>
  );
};

export default PinLock;
