'use client';

import React from 'react';

export default function LetterMatchBadge({ letter }: { letter: string | null }) {
  if (!letter) return null;

  return (
    <div className="flex items-center space-x-3 bg-purple-100 border-2 border-purple-500 rounded-full px-6 py-2 shadow-lg animate-bounce">
      <span className="text-purple-800 font-bold uppercase tracking-tight">Lettre du Match :</span>
      <span className="text-4xl font-black text-purple-600">{letter}</span>
    </div>
  );
}
