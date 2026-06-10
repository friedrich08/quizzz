import { NextResponse } from 'next/server';
import { getGame, setGame } from '@/lib/game-state';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: Request) {
  const { code, pseudo, userId } = await request.json();

  const game = await getGame(code);

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  if (game.players.length >= 8) {
    return NextResponse.json({ error: 'Game is full' }, { status: 400 });
  }

  if (game.players.some(p => p.id === userId)) {
    return NextResponse.json({ code }); // Already in
  }

  const newPlayer = {
    id: userId,
    pseudo,
    score: 0,
    isHost: false,
  };

  game.players.push(newPlayer);
  await setGame(code, game);

  await pusherServer.trigger(`game-${code}`, 'player-joined', {
    players: game.players,
  });

  return NextResponse.json({ code });
}
