import { NextResponse } from 'next/server';
import { getGame } from '@/lib/game-state';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const game = await getGame(code);

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json(game);
}
