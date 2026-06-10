'use client';

import React from 'react';

interface BuzzerProps {
  onBuzz: () => void;
  disabled: boolean;
  isLockedByMe: boolean;
  lockedByPseudo: string | null;
}

export default function Buzzer({ onBuzz, disabled, isLockedByMe, lockedByPseudo }: BuzzerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <button
        onClick={onBuzz}
        disabled={disabled || !!lockedByPseudo}
        className={`
          w-64 h-64 rounded-full border-8 shadow-2xl transition-all active:scale-95
          ${disabled || !!lockedByPseudo ? 'bg-gray-400 border-gray-500 cursor-not-allowed' : 'bg-red-600 border-red-800 hover:bg-red-500 hover:shadow-red-500/50'}
          flex items-center justify-center text-white text-4xl font-bold uppercase tracking-widest
        `}
      >
        {lockedByPseudo ? (isLockedByMe ? 'À TOI !' : lockedByPseudo) : 'BUZZ'}
      </button>
      
      {lockedByPseudo && (
        <p className="text-xl font-semibold text-red-600 animate-pulse">
          {isLockedByMe ? "C'est ton tour ! Réponds vite !" : `${lockedByPseudo} a buzzé !`}
        </p>
      )}
    </div>
  );
}
