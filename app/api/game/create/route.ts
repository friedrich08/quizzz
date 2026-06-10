import { NextResponse } from 'next/server';
import { setGame } from '@/lib/game-state';
import { GameState } from '@/types/game';

export async function POST(request: Request) {
  const { pseudo, userId } = await request.json();

  if (!pseudo || !userId) {
    return NextResponse.json({ error: 'Pseudo and userId are required' }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const gameState: GameState = {
    code,
    players: [
      {
        id: userId,
        pseudo,
        score: 0,
        isHost: true,
      },
    ],
    phase: 'LOBBY',
    currentQuestion: null,
    buzzerLockedBy: null,
    attempts: 0,
    letter: null,
    category: null,
    lastBuzzer: null,
    questionCount: 0,
  };

  await setGame(code, gameState);

  return NextResponse.json({ code });
}
