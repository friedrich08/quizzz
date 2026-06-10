'use client';

import React from 'react';
import { Player } from '@/types/game';

interface ScoreboardProps {
  players: Player[];
}

export default function Scoreboard({ players }: ScoreboardProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Classement</h3>
      <div className="space-y-3">
        {players.sort((a, b) => b.score - a.score).map((player, index) => (
          <div key={player.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>
                {index + 1}
              </span>
              <span className="font-semibold text-gray-800">
                {player.pseudo} {player.isHost && '👑'}
              </span>
            </div>
            <span className="text-xl font-black text-blue-600">{player.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
