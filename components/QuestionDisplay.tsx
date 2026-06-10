'use client';

import React, { useEffect, useState } from 'react';
import { Question } from '@/types/game';

interface QuestionDisplayProps {
  question: Question | null;
  phase: string;
  onTimeUp?: () => void;
  revealAnswer?: string | null;
}

export default function QuestionDisplay({ question, phase, onTimeUp, revealAnswer }: QuestionDisplayProps) {
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    if (!question || revealAnswer) {
      setTimer(15);
      return;
    }

    setTimer(15);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question, revealAnswer]);

  // Déclencher onTimeUp en dehors de l'updater de state pour éviter les effets de bord
  useEffect(() => {
    if (timer === 0 && !revealAnswer && question) {
      onTimeUp?.();
    }
  }, [timer, revealAnswer, question, onTimeUp]);

  if (revealAnswer) {
    return (
      <div className="bg-yellow-100 border-4 border-yellow-500 rounded-2xl p-8 text-center animate-bounce">
        <p className="text-xl text-yellow-800 font-bold mb-2 uppercase">La réponse était :</p>
        <p className="text-4xl font-black text-yellow-600">{revealAnswer}</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-8 text-center">
        <p className="text-2xl text-blue-800 font-medium italic">Préparation de la question...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-blue-500 rounded-2xl p-8 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 h-2 bg-blue-500 transition-all duration-1000" style={{ width: `${(timer / 15) * 100}%` }} />
      
      <div className="flex justify-between items-center mb-4">
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase">
          {question.category}
        </span>
        <span className={`text-2xl font-black ${timer <= 5 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
          {timer}s
        </span>
      </div>

      <h2 className="text-3xl font-bold text-gray-800 leading-tight">
        {question.question}
      </h2>
    </div>
  );
}
