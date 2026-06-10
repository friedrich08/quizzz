import { NextResponse } from 'next/server';
import { getGame, setGame } from '@/lib/game-state';
import { pusherServer } from '@/lib/pusher';
import { distance } from 'fastest-levenshtein';

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .trim();
}

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { userId, answer, isTimeUp } = await request.json();
  const { code } = params;

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const correctAnswer = game.currentQuestion?.correct_answer || "";

  if (isTimeUp) {
    await pusherServer.trigger(`game-${code}`, 'answer-result', {
      isCorrect: false,
      revealAnswer: correctAnswer,
      isTimeUp: true
    });
    game.currentQuestion = null;
    game.buzzerLockedBy = null;
    game.attempts = 0;
    await setGame(code, game);
    return NextResponse.json({ success: true });
  }

  const player = game.players.find(p => p.id === (userId || game.buzzerLockedBy));
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

  const normUser = normalize(answer || "");
  const normTarget = normalize(correctAnswer);

  const dist = distance(normUser, normTarget);
  const threshold = normTarget.length > 5 ? 2 : 1;

  let isCorrect = (normUser === normTarget) || (dist <= threshold);

  if (game.phase === 'C' && game.letter) {
    if (!normUser.startsWith(game.letter.toLowerCase())) {
      isCorrect = false;
    }
  }

  if (isCorrect) {
    let basePoints = (game.phase === 'B' ? 20 : 10);
    let points = game.attempts >= 1 ? basePoints / 2 : basePoints;
    
    player.score += points;
    
    await pusherServer.trigger(`game-${code}`, 'answer-result', {
      isCorrect: true,
      playerId: player.id,
      revealAnswer: correctAnswer,
      scores: game.players.map(p => ({ id: p.id, score: p.score })),
    });
    
    game.buzzerLockedBy = null;
    game.currentQuestion = null;
    game.attempts = 0;
  } else {
    game.attempts += 1;
    game.buzzerLockedBy = null;

    const shouldReveal = game.attempts >= 2;
    if (shouldReveal) {
        game.currentQuestion = null;
        game.attempts = 0;
    }

    await pusherServer.trigger(`game-${code}`, 'answer-result', {
      isCorrect: false,
      playerId: player.id,
      revealAnswer: shouldReveal ? correctAnswer : null,
      attempts: game.attempts,
    });
  }

  await setGame(code, game);
  return NextResponse.json({ success: true });
}
