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
  const [timer, setTimer] = useState(30);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!question || revealAnswer) {
      setTimer(30);
      setDisplayText('');
      return;
    }

    setTimer(30);
    setDisplayText('');

    // Effet de machine à écrire
    let index = 0;
    const typingInterval = setInterval(() => {
      setDisplayText(question.question.substring(0, index));
      index += 2; // On avance de 2 caractères pour plus de fluidité
      if (index > question.question.length + 1) {
        setDisplayText(question.question);
        clearInterval(typingInterval);
      }
    }, 40);

    const timerInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(typingInterval);
      clearInterval(timerInterval);
    };
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
    <div className="bg-white border-4 border-blue-500 rounded-2xl p-8 shadow-xl relative overflow-hidden min-h-[200px] flex flex-col justify-center">
      <div className="absolute top-0 left-0 h-2 bg-blue-500 transition-all duration-1000" style={{ width: `${(timer / 30) * 100}%` }} />
      
      <div className="flex justify-between items-center mb-4">
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase">
          {question.category}
        </span>
        <span className={`text-2xl font-black ${timer <= 5 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
          {timer}s
        </span>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
        {displayText}
        <span className="animate-pulse ml-1">|</span>
      </h2>
    </div>
  );
}
