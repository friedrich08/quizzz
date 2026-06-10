'use client';

import React from 'react';
import { Phase } from '@/types/game';

interface PhaseControlProps {
  currentPhase: Phase;
  onNextQuestion: () => void;
  disabled: boolean;
}

export default function PhaseControl({
  currentPhase,
  onNextQuestion,
  disabled
}: PhaseControlProps) {
  return (
    <div className="bg-slate-800 text-white p-6 rounded-2xl space-y-4 shadow-xl border-t-4 border-blue-500">
      <div className="text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Contrôle de l'Hôte</p>
        <h3 className="text-xl font-black italic">
          {currentPhase === 'LOBBY' ? 'PRÊT ?' : `PHASE ${currentPhase}`}
        </h3>
      </div>

      <button
        onClick={onNextQuestion}
        disabled={disabled}
        className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest transition-all shadow-lg active:scale-95
          ${disabled 
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/40'}
        `}
      >
        {currentPhase === 'LOBBY' ? 'DÉMARRER LE JEU' : 'QUESTION SUIVANTE'}
      </button>
      
      <p className="text-[10px] text-center text-slate-500 italic">
        Le jeu passera automatiquement à la phase suivante après 10 questions.
      </p>
    </div>
  );
}
