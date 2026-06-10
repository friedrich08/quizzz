export type Phase = 'A' | 'B' | 'C' | 'LOBBY' | 'FINISHED';

export interface Player {
  id: string;
  pseudo: string;
  score: number;
  isHost: boolean;
}

export interface Question {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface GameState {
  code: string;
  players: Player[];
  phase: Phase;
  currentQuestion: Question | null;
  buzzerLockedBy: string | null;
  attempts: number;
  letter: string | null;
  category: string | null;
  lastBuzzer: string | null;
  questionCount: number;
}
