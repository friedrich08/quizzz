import { NextResponse } from 'next/server';
import { getGame, setGame } from '@/lib/game-state';
import { pusherServer } from '@/lib/pusher';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { userId } = await request.json();
  const { code } = params;

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  if (game.buzzerLockedBy) {
    return NextResponse.json({ error: 'Buzzer already locked' }, { status: 400 });
  }

  game.buzzerLockedBy = userId;
  game.lastBuzzer = userId;
  await setGame(code, game);

  await pusherServer.trigger(`game-${code}`, 'buzz-result', {
    userId,
    pseudo: game.players.find(p => p.id === userId)?.pseudo,
  });

  return NextResponse.json({ success: true });
}
