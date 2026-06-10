import { NextResponse } from 'next/server';
import { getGame, setGame } from '@/lib/game-state';
import { pusherServer } from '@/lib/pusher';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { phase } = await request.json();
  const { code } = params;

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  game.phase = phase;
  game.currentQuestion = null;
  game.buzzerLockedBy = null;
  game.attempts = 0;
  await setGame(code, game);

  await pusherServer.trigger(`game-${code}`, 'phase-change', {
    phase,
  });

  return NextResponse.json({ success: true });
}
