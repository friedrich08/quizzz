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

  // CAS : TEMPS ÉCOULÉ
  if (isTimeUp) {
    game.currentQuestion = null;
    game.buzzerLockedBy = null;
    game.attempts = 0;
    await setGame(code, game);

    await pusherServer.trigger(`game-${code}`, 'answer-result', {
      isCorrect: false,
      revealAnswer: correctAnswer,
      isTimeUp: true,
      autoNext: true // Signal pour charger la suivante
    });
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
    if (!normUser.startsWith(game.letter.toLowerCase())) isCorrect = false;
  }

  if (isCorrect) {
    // Calcul des points (A:10, B:20, C:10)
    let basePoints = (game.phase === 'B' ? 20 : 10);
    // 2ème essai = moitié des points
    let awardedPoints = game.attempts >= 1 ? basePoints / 2 : basePoints;
    
    player.score += awardedPoints;
    
    game.buzzerLockedBy = null;
    game.currentQuestion = null;
    game.attempts = 0;
    
    // ON SAUVEGARDE AVANT DE TRIGER
    await setGame(code, game);

    await pusherServer.trigger(`game-${code}`, 'answer-result', {
      isCorrect: true,
      playerId: player.id,
      revealAnswer: correctAnswer,
      scores: game.players.map(p => ({ id: p.id, score: p.score })),
      autoNext: true
    });
  } else {
    game.attempts += 1;
    game.buzzerLockedBy = null; // Libère le buzzer pour les autres

    const shouldReveal = game.attempts >= 2;
    if (shouldReveal) {
        game.currentQuestion = null;
        game.attempts = 0;
    }

    await setGame(code, game);

    await pusherServer.trigger(`game-${code}`, 'answer-result', {
      isCorrect: false,
      playerId: player.id,
      revealAnswer: shouldReveal ? correctAnswer : null, // Uniquement si 2 erreurs
      attempts: game.attempts,
      autoNext: shouldReveal
    });
  }

  return NextResponse.json({ success: true });
}
