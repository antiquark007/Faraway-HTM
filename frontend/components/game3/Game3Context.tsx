'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Game3Config, SessionState, ConceptCard, InputMode, EvaluationResult, FullResults, CardResult } from '../../lib/game3.types';
import { apiRequest } from '@/lib/auth';

interface Game3ContextValue {
  sessionConfig: Game3Config | null;
  sessionId: string | null;
  sessionState: SessionState | null;
  currentCard: ConceptCard | null;
  currentRound: number;
  inputMode: InputMode;
  answer: string;
  audioBlob: Blob | null;
  timeRemaining: number;
  timerActive: boolean;
  evaluationResult: EvaluationResult | null;
  isEvaluating: boolean;
  results: FullResults | null;
  streak: number;
  livesRemaining: number;
  
  setInputMode: (mode: InputMode) => void;
  setAnswer: (text: string) => void;
  setAudioBlob: (blob: Blob | null) => void;
  submitAnswer: () => Promise<void>;
  startGame: () => Promise<void>;
  advanceToNextCard: () => void;
  abandonGame: () => Promise<void>;
}

const Game3Context = createContext<Game3ContextValue | undefined>(undefined);

export function Game3Provider({ children }: { children: React.ReactNode }) {
  const [sessionConfig, setSessionConfig] = useState<Game3Config | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('lobby');
  const [currentCard, setCurrentCard] = useState<ConceptCard | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [answer, setAnswer] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<FullResults | null>(null);
  const [streak, setStreak] = useState(0);
  const [livesRemaining, setLivesRemaining] = useState(3);
  const [cardHistory, setCardHistory] = useState<CardResult[]>([]);

  const recordProgress = async (payload: {
    outcome: 'completed' | 'eliminated'
    totalXp: number
    finalScore: number
    history: CardResult[]
  }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) return

    const weakAreas = Array.from(new Set(
      payload.history
        .filter((card) => card.totalScore < 60)
        .map((card) => card.card.category)
    ))

    try {
      await apiRequest('/api/dashboard/activity', {
        method: 'POST',
        token,
        suppressErrors: true,
        body: {
          gameKey: 'game3',
          title: 'Articulate Master',
          score: payload.finalScore,
          pointsAwarded: payload.totalXp,
          summary: payload.outcome === 'completed'
            ? 'Completed the articulation challenge and received evaluation feedback.'
            : 'Ended the articulation challenge early and recorded improvement areas.',
          focusAreas: weakAreas.length > 0 ? weakAreas : ['clarity', 'structured-answers'],
        },
      })
    } catch (error) {
      console.error('Failed to record game3 progress:', error)
    }
  };

  // Timer Effect
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return;
    const interval = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  // Auto-submit on 0
  useEffect(() => {
    if (timeRemaining === 0 && timerActive) {
      setTimerActive(false);
      submitAnswer();
    }
  }, [timeRemaining, timerActive]);

  // Initial Config Fetch
  useEffect(() => {
    setTimeout(() => {
      setSessionConfig({ timePerRound: 90, totalLives: 3, totalRounds: 5 });
    }, 800);
  }, []);

  const startGame = async () => {
    setSessionState('playing');
    setSessionId(`sess_${Math.random().toString(36).substring(2, 11)}`);
    setLivesRemaining(sessionConfig?.totalLives || 3);
    setCurrentRound(1);
    setStreak(0);
    setCardHistory([]);
    fetchNextCard();
  };

  const fetchNextCard = async () => {
    // Get all the IDs we've already played so we don't get repeats
    const usedIds = cardHistory.map(h => h.card.id);

    try {
      const response = await fetch('http://localhost:5000/api/game3/next-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeIds: usedIds })
      });
      const result = await response.json();

      if (result.status === 'success') {
        setCurrentCard(result.data);
        setTimeRemaining(sessionConfig?.timePerRound || 90);
        setTimerActive(true);
        setAnswer('');
        setAudioBlob(null);
        setEvaluationResult(null);
      } else {
        // If we somehow run out of questions, just end the game gracefully
        generateFinalResults('completed');
      }
    } catch (error) {
      console.error("Failed to fetch next card:", error);
    }
  };

  const submitAnswer = async () => {
    setTimerActive(false);
    setIsEvaluating(true);
    setSessionState('evaluating');

    try {
      let response;

      // 1. ROUTE AUDIO TO THE MULTIPART ENDPOINT
      if (inputMode === 'mic' && audioBlob) {
        const formData = new FormData();
        formData.append('questionId', currentCard!.id);
        // We append '.webm' so Flask and Gemini know exactly how to parse the audio format
        formData.append('audio', audioBlob, 'recording.webm');

        response = await fetch('http://localhost:5000/api/game3/evaluate', {
          method: 'POST',
          body: formData,
          // Note: Do NOT set the 'Content-Type' header here. 
          // The browser automatically sets it with the correct multipart boundary for FormData.
        });
      } 
      // 2. ROUTE TEXT TO THE JSON ENDPOINT
      else {
        response = await fetch('http://localhost:5000/api/game3/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: currentCard!.id,
            answer: answer,
          })
        });
      }

      const result = await response.json();

      if (result.status === 'success') {
        const evalData = result.data;
        const lifeLost = evalData.lifeConsumed;
        const isGood = evalData.totalScore >= 70; // 70+ keeps the streak alive

        // Map the backend's multi-agent JSON perfectly to your frontend state
        const newEvaluation: EvaluationResult = {
          clarity: evalData.clarity,
          structure: evalData.structure,
          depth: evalData.depth,
          brevity: evalData.brevity,
          totalScore: evalData.totalScore,
          feedback: evalData.feedback,
          xpAwarded: evalData.xpAwarded,
          lifeConsumed: lifeLost,
          livesRemaining: livesRemaining - (lifeLost ? 1 : 0),
          streak: isGood && !lifeLost ? streak + 1 : 0
        };

        setStreak(newEvaluation.streak);
        setLivesRemaining(newEvaluation.livesRemaining);
        setEvaluationResult(newEvaluation);

        const nextHistory = [...cardHistory, { ...newEvaluation, card: currentCard! }];
        setCardHistory(nextHistory);

        // UI State Machine Transitions
        if (newEvaluation.livesRemaining <= 0) {
          generateFinalResults('eliminated', nextHistory);
        } else if (lifeLost) {
          setSessionState('life_lost');
        } else {
          setSessionState('score_reveal');
        }
      } else {
        console.error("Backend Error:", result.message);
        setSessionState('playing'); // Fail gracefully back to the board
      }

    } catch (error) {
      console.error("Network Error:", error);
      setSessionState('playing'); // Fail gracefully back to the board
    } finally {
      setIsEvaluating(false);
    }
  };

  const advanceToNextCard = () => {
    if (currentRound >= (sessionConfig?.totalRounds || 5)) {
      generateFinalResults('completed');
    } else {
      setCurrentRound(prev => prev + 1);
      setSessionState('playing');
      fetchNextCard();
    }
  };

  const generateFinalResults = (outcome: 'completed' | 'eliminated', historySnapshot: CardResult[] = cardHistory) => {
    const totalXp = historySnapshot.reduce((acc, curr) => acc + curr.xpAwarded, 0)
    const finalScore = Math.round(historySnapshot.reduce((acc, curr) => acc + curr.totalScore, 0) / Math.max(historySnapshot.length, 1))

    const finalResults = {
      outcome,
      totalXp,
      finalScore,
      cardBreakdown: historySnapshot,
      agentSummary: {
        clarity: "You generally speak clearly, but occasionally use filler words.",
        structure: "Good start, but try to use the STAR method when explaining tradeoffs.",
        depth: "Strong technical depth shown.",
        brevity: "You kept answers concise and respected the time limits.",
        overall: "Solid performance. Work on reducing 'ums' to sound more authoritative."
      }
    }

    setResults(finalResults);
    void recordProgress({ outcome, totalXp, finalScore, history: historySnapshot });
    setSessionState('game_over');
  };

  const abandonGame = async () => {
    setSessionState('lobby');
  };

  return (
    <Game3Context.Provider value={{
      sessionConfig, sessionId, sessionState, currentCard, currentRound,
      inputMode, answer, audioBlob, timeRemaining, timerActive,
      evaluationResult, isEvaluating, results, streak, livesRemaining,
      setInputMode, setAnswer, setAudioBlob, submitAnswer, startGame, advanceToNextCard, abandonGame
    }}>
      {children}
    </Game3Context.Provider>
  );
}

export const useGame3 = () => {
  const context = useContext(Game3Context);
  if (!context) throw new Error('useGame3 must be used within Game3Provider');
  return context;
};

