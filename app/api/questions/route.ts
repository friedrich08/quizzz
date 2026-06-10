import { NextResponse } from 'next/server';
import { getGame, setGame } from '@/lib/game-state';
import { pusherServer } from '@/lib/pusher';
import { Question, Phase } from '@/types/game';

const CATEGORIES = ['9', '11', '12', '17', '21', '22', '23'];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

async function translateToFrench(text: string): Promise<string> {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`);
    const data = await res.json();
    return data.responseData.translatedText || text;
  } catch (e) {
    return text;
  }
}

function decodeHtml(html: string) {
  return html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const game = await getGame(code);
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    if (game.questionCount >= 10 || game.phase === 'LOBBY') {
      let nextPhase: Phase = 'A';
      if (game.phase === 'A') nextPhase = 'B';
      else if (game.phase === 'B') nextPhase = 'C';
      else if (game.phase === 'C') nextPhase = 'FINISHED';

      game.phase = nextPhase;
      game.questionCount = 0;
      game.letter = null;
      game.category = null;

      if (nextPhase === 'FINISHED') {
        await pusherServer.trigger(`game-${code}`, 'phase-change', { phase: 'FINISHED' });
        return NextResponse.json({ success: true, finished: true });
      }

      if (nextPhase === 'B') {
        game.category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      } else if (nextPhase === 'C') {
        game.letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      }

      await pusherServer.trigger(`game-${code}`, 'phase-change', { 
        phase: nextPhase,
        letter: game.letter,
        category: game.category
      });
    }

    let url = `https://opentdb.com/api.php?amount=1&type=multiple&difficulty=easy`;
    if (game.phase === 'B' && game.category) url += `&category=${game.category}`;

    let selectedQuestion: Question | null = null;
    let attempts = 0;

    while (!selectedQuestion && attempts < 10) {
      const res = await fetch(url);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        let q = data.results[0];
        q.question = decodeHtml(q.question);
        q.correct_answer = decodeHtml(q.correct_answer);
        q.incorrect_answers = q.incorrect_answers.map(decodeHtml);

        q.question = await translateToFrench(q.question);
        q.correct_answer = await translateToFrench(q.correct_answer);

        if (game.phase === 'C' && game.letter) {
          if (q.correct_answer.toLowerCase().trim().startsWith(game.letter.toLowerCase())) {
            selectedQuestion = q;
          }
        } else {
          selectedQuestion = q;
        }
      }
      attempts++;
    }

    if (selectedQuestion) {
      game.currentQuestion = selectedQuestion;
      game.buzzerLockedBy = null;
      game.attempts = 0;
      game.lastBuzzer = null;
      game.questionCount += 1;
      await setGame(code, game);

      const questionForPlayers = { ...selectedQuestion, correct_answer: '???' };

      await pusherServer.trigger(`game-${code}`, 'question-start', {
        question: questionForPlayers,
        questionCount: game.questionCount,
        phase: game.phase
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Failed to find question' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
