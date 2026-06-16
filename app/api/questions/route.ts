import { NextResponse } from 'next/server';
import { getGame, setGame } from '@/lib/game-state';
import { pusherServer } from '@/lib/pusher';
import { Question, Phase } from '@/types/game';
import fs from 'fs';
import path from 'path';

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Chargement des questions locales
const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
let allQuestions: any[] = [];

try {
  if (fs.existsSync(questionsPath)) {
    allQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  }
} catch (e) {
  console.error("Erreur chargement questions:", e);
}

function toLongQuestion(q: any): string {
  let longQ = `[${q.theme}] Top ! `;
  
  // Utilisation de l'anecdote comme premier indice s'il est assez long
  if (q.anecdote && q.anecdote.length > 15) {
    const lowerAns = q.answer.toLowerCase();
    const lowerAnecdote = q.anecdote.toLowerCase();
    
    // Si l'anecdote contient la réponse, on la masque pour ne pas spoiler
    let cleanAnecdote = q.anecdote;
    if (lowerAnecdote.includes(lowerAns)) {
      const regex = new RegExp(q.answer, 'gi');
      cleanAnecdote = q.anecdote.replace(regex, "...");
    }
    longQ += cleanAnecdote + " ";
  }
  
  longQ += q.question;
  if (!longQ.includes('?')) longQ += " ?";
  
  return longQ;
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const game = await getGame(code);
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    // 1. Gestion des phases (10 questions max par phase)
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
        // Sélection de 4 thèmes aléatoires parmis les questions dispo
        const themes = Array.from(new Set(allQuestions.map(q => q.theme)));
        game.category = themes[Math.floor(Math.random() * themes.length)] as string;
      } else if (nextPhase === 'C') {
        game.letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      }

      await pusherServer.trigger(`game-${code}`, 'phase-change', { 
        phase: nextPhase,
        letter: game.letter,
        category: game.category
      });
    }

    // 2. Sélection de la question dans la base locale
    let filtered = allQuestions;

    if (game.phase === 'B' && game.category) {
      filtered = allQuestions.filter(q => q.theme === game.category);
    } else if (game.phase === 'C' && game.letter) {
      filtered = allQuestions.filter(q => 
        q.answer.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(game.letter!.toLowerCase())
      );
    }

    if (filtered.length === 0) filtered = allQuestions; // Fallback

    const randomIdx = Math.floor(Math.random() * filtered.length);
    const rawQ = filtered[randomIdx];

    const selectedQuestion: Question = {
      category: rawQ.theme,
      type: 'multiple',
      difficulty: rawQ.difficulty,
      question: toLongQuestion(rawQ),
      correct_answer: rawQ.answer,
      incorrect_answers: rawQ.propositions.filter((p: string) => p !== rawQ.answer)
    };

    if (selectedQuestion) {
      game.currentQuestion = selectedQuestion;
      game.buzzerLockedBy = null;
      game.attempts = 0;
      game.lastBuzzer = null;
      game.questionCount += 1;
      await setGame(code, game);

      // On cache la réponse pour l'envoi Pusher
      const questionForPlayers = { ...selectedQuestion, correct_answer: '???' };

      await pusherServer.trigger(`game-${code}`, 'question-start', {
        question: questionForPlayers,
        questionCount: game.questionCount,
        phase: game.phase
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Pas de question trouvée' }, { status: 404 });
  } catch (error) {
    console.error("[API ERROR]", error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
