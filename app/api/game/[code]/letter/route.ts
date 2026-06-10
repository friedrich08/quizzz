import { NextResponse } from 'next/server';
import { getGame, setGame } from '@/lib/game-state';
import { pusherServer } from '@/lib/pusher';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { letter } = await request.json();
  const { code } = params;

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  game.letter = letter;
  await setGame(code, game);

  await pusherServer.trigger(`game-${code}`, 'letter-change', {
    letter,
  });

  return NextResponse.json({ success: true });
}
