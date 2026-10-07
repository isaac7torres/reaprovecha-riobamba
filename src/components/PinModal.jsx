import React, { useState } from 'react';
import { Lock, KeyRound, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { DB } from '../services/db';

export function PinModal({ isOpen, onClose, targetRole, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!pin) {
      setError('Por favor ingresa tu PIN');
      return;
    }

    const res = DB.verifyPin(pin, targetRole);
    if (res.success) {
      onSuccess(res.user);
      setPin('');
      setError('');
    } else {
      setError(res.message || 'PIN inválido');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 transform transition-all">
        
        {/* Modal Header */}
        <div className="bg-reaprovecha-green p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-3 backdrop-blur-md border border-white/20">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold">Ingreso con PIN</h3>
          <p className="text-xs text-white/80 mt-1">
            {targetRole === 'ADMIN' ? 'Modo Administrador (PIN: 9999)' : 'Practicantes / Registradores (PIN: 1234)'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PIN Indicators */}
          <div className="flex justify-center space-x-3 mb-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  idx < pin.length
                    ? 'bg-reaprovecha-orange border-reaprovecha-orange scale-110'
                    : 'border-gray-300 bg-gray-50'
                }`}
              />
            ))}
          </div>

          {/* Keypad Numeric Táctil */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(String(num))}
                className="py-3 text-xl font-bold text-gray-800 bg-gray-50 hover:bg-reaprovecha-green-soft hover:text-reaprovecha-green rounded-2xl transition-all active:scale-95 shadow-sm border border-gray-100"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-3 text-xl font-bold text-gray-800 bg-gray-50 hover:bg-reaprovecha-green-soft hover:text-reaprovecha-green rounded-2xl transition-all active:scale-95 shadow-sm border border-gray-100"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-3 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-all"
            >
              ⌫
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 bg-reaprovecha-green text-white font-bold rounded-2xl shadow-lg hover:bg-reaprovecha-green-dark transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Verificar e Ingresar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
