'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';
import { GameState, Player, Phase, Question } from '@/types/game';
import Buzzer from '@/components/Buzzer';
import QuestionDisplay from '@/components/QuestionDisplay';
import Scoreboard from '@/components/Scoreboard';
import PhaseControl from '@/components/PhaseControl';
import LetterMatchBadge from '@/components/LetterMatchBadge';

export const dynamic = 'force-dynamic';

export default function GameRoom({ params }: { params: { code: string } }) {
  const { code } = params;
  const searchParams = useSearchParams();
  const isHost = searchParams.get('host') === 'true';

  const [gameState, setGameState] = useState<Partial<GameState>>({
    players: [],
    phase: 'LOBBY',
    currentQuestion: null,
    buzzerLockedBy: null,
    letter: null,
    questionCount: 0,
    category: null,
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [lastBuzzerId, setLastBuzzerId] = useState<string | null>(null);

  // Ref pour éviter les problèmes de fermeture sur les fonctions asynchrones
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  const handleNextQuestion = async () => {
    if (loadingQuestion) return;
    setLoadingQuestion(true);
    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
    } catch (e) {
      console.error(e);
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const res = await fetch(`/api/game/${code}`);
        if (res.ok) {
          const data = await res.json();
          setGameState(data);
        }
      } catch (e) {}
    };
    fetchInitialState();
  }, [code]);

  useEffect(() => {
    const id = localStorage.getItem('quizzz_userId');
    setUserId(id);

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${code}`);

    channel.bind('player-joined', (data: { players: Player[] }) => {
      setGameState(prev => ({ ...prev, players: data.players }));
    });

    channel.bind('question-start', (data: { question: Question; questionCount: number; phase: Phase }) => {
      setGameState(prev => ({ 
        ...prev, 
        currentQuestion: data.question, 
        buzzerLockedBy: null,
        questionCount: data.questionCount,
        phase: data.phase
      }));
      setAnswer('');
      setRevealAnswer(null);
      setLoadingQuestion(false);
      setLastBuzzerId(null);
    });

    channel.bind('buzz-result', (data: { userId: string; pseudo: string }) => {
      setGameState(prev => ({ ...prev, buzzerLockedBy: data.userId }));
      setLastBuzzerId(data.userId);
    });

    channel.bind('answer-result', (data: { isCorrect: boolean; playerId: string; revealAnswer?: string; scores?: any; attempts?: number, autoNext?: boolean }) => {
      // 1. Mise à jour de la réponse révélée
      if (data.revealAnswer) {
        setRevealAnswer(data.revealAnswer);
        setTimeout(() => setRevealAnswer(null), 4000);
      }

      // 2. Mise à jour des scores
      if (data.scores) {
        setGameState(prev => ({
          ...prev,
          players: prev.players?.map(p => {
            const newScore = data.scores.find((s: any) => s.id === p.id)?.score;
            return newScore !== undefined ? { ...p, score: newScore } : p;
          })
        }));
      }

      // 3. Gestion de l'état du tour
      if (data.isCorrect || (data.attempts && data.attempts >= 2) || data.revealAnswer) {
        setGameState(prev => ({ ...prev, buzzerLockedBy: null, currentQuestion: null }));
      } else {
        setGameState(prev => ({ ...prev, buzzerLockedBy: null }));
      }

      // 4. AUTOMATISATION : Question suivante après 5 secondes si c'est fini
      if (data.autoNext && isHostRef.current) {
        setTimeout(() => {
          handleNextQuestion();
        }, 5000);
      }
    });

    channel.bind('phase-change', (data: { phase: Phase; letter?: string; category?: string }) => {
      setGameState(prev => ({ 
        ...prev, 
        phase: data.phase, 
        currentQuestion: null, 
        buzzerLockedBy: null, 
        questionCount: 0,
        letter: data.letter || null,
        category: data.category || null
      }));
      setRevealAnswer(null);
    });

    return () => {
      pusher.unsubscribe(`game-${code}`);
    };
  }, [code]);

  const handleBuzz = async () => {
    if (!userId || gameState.buzzerLockedBy || revealAnswer || loadingQuestion || lastBuzzerId === userId) return;
    try {
      await fetch(`/api/game/${code}/buzz`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch (e) {}
  };

  const submitAnswer = async () => {
    if (!answer) return;
    try {
      await fetch(`/api/game/${code}/answer`, {
        method: 'POST',
        body: JSON.stringify({ userId, answer }),
      });
      setAnswer('');
    } catch (e) {}
  };

  const handleTimeUp = async () => {
    if (isHost && gameState.currentQuestion && !gameState.buzzerLockedBy && !revealAnswer) {
      try {
        await fetch(`/api/game/${code}/answer`, {
          method: 'POST',
          body: JSON.stringify({ isTimeUp: true }),
        });
      } catch (e) {}
    }
  };

  const isMyTurn = gameState.buzzerLockedBy === userId;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row p-4 md:p-8 gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 order-2 md:order-1">
        <div className="sticky top-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-100 text-center text-black">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">
               Code de la salle
            </h2>
            <p className="text-4xl font-black text-slate-800 tracking-tighter mb-4">{code}</p>
            
            {gameState.phase !== 'LOBBY' && gameState.phase !== 'FINISHED' && (
              <div className="border-t pt-4">
                 <p className="text-xs font-bold text-slate-400 uppercase">Phase {gameState.phase}</p>
                 <p className="text-2xl font-black text-blue-600">Q {gameState.questionCount} / 10</p>
              </div>
            )}
          </div>
          
          <Scoreboard players={gameState.players || []} />
          
          {isHost && gameState.phase !== 'FINISHED' && (
            <PhaseControl
              currentPhase={gameState.phase as Phase}
              onNextQuestion={handleNextQuestion}
              disabled={loadingQuestion || (!!gameState.currentQuestion)}
            />
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-start space-y-12 order-1 md:order-2 text-black">
        <div className="w-full max-w-2xl text-center space-y-4">
          <div className="flex justify-center">
            <LetterMatchBadge letter={gameState.letter || null} />
          </div>
          
          <QuestionDisplay 
            question={gameState.currentQuestion || null} 
            phase={gameState.phase || 'A'} 
            revealAnswer={revealAnswer}
            onTimeUp={handleTimeUp}
          />
        </div>

        {gameState.phase === 'FINISHED' && (
           <div className="text-center bg-yellow-400 p-12 rounded-3xl shadow-2xl animate-bounce">
              <h2 className="text-5xl font-black text-white mb-4">PARTIE TERMINÉE !</h2>
              <p className="text-2xl font-bold text-yellow-900">Le champion est {gameState.players?.sort((a,b) => b.score - a.score)[0]?.pseudo} !</p>
              <button onClick={() => window.location.href = '/'} className="mt-8 bg-white text-yellow-600 px-8 py-3 rounded-full font-bold">REJOUER</button>
           </div>
        )}

        {gameState.currentQuestion && !revealAnswer && (
          <div className="w-full max-w-md flex flex-col items-center space-y-8">
            {isMyTurn ? (
              <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                <input
                  type="text"
                  placeholder="Ta réponse..."
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                  className="w-full px-8 py-6 rounded-3xl border-4 border-blue-500 outline-none text-2xl font-bold shadow-2xl text-center text-black"
                />
                <button
                  onClick={submitAnswer}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg hover:bg-blue-700 transition-all"
                >
                  VALIDER
                </button>
              </div>
            ) : (
              <Buzzer
                onBuzz={handleBuzz}
                disabled={!gameState.currentQuestion || !!gameState.buzzerLockedBy || (lastBuzzerId === userId)}
                isLockedByMe={isMyTurn}
                lockedByPseudo={gameState.players?.find(p => p.id === gameState.buzzerLockedBy)?.pseudo || null}
              />
            )}
          </div>
        )}

        {gameState.phase === 'LOBBY' && !gameState.currentQuestion && (
          <div className="text-center bg-white p-12 rounded-3xl border-2 border-blue-100 shadow-sm max-w-lg">
            <h3 className="text-3xl font-black text-blue-800 mb-6 italic">SALLE D'ATTENTE</h3>
            <div className="space-y-4 text-left">
              <p className="text-slate-600 font-medium">1. Partage le code <span className="font-black text-blue-600">{code}</span> avec tes amis.</p>
              <p className="text-slate-600 font-medium">2. Attends que tout le monde soit connecté.</p>
              <p className="text-slate-600 font-medium">3. {isHost ? "Clique sur 'DÉMARRER LE JEU' pour lancer la Phase A." : "L'hôte lancera la partie bientôt !"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
