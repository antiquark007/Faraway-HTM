'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SessionState, GooglyQuestion, OptionState, RevealResult, LifelineType } from '../../lib/game4.types';
import { apiRequest } from '@/lib/auth';

interface Game4ContextValue {
  sessionId: string | null;
  sessionState: SessionState;
  currentQuestion: GooglyQuestion | null;
  currentRound: number;
  totalRounds: number;
  googlyRating: number;
  confidenceBet: 1 | 2 | 3 | null;
  selectedOptionId: string | null;
  openAnswer: string;
  optionStates: Record<string, OptionState>;
  typewriterDone: boolean;
  hintText: string | null;
  usedLifelines: Record<LifelineType, boolean>;
  revealResult: RevealResult | null;
  isSubmitting: boolean;
  setConfidenceBet: (bet: 1 | 2 | 3) => void;
  selectOption: (id: string) => void;
  setOpenAnswer: (text: string) => void;
  setTypewriterDone: (done: boolean) => void;
  useLifeline: (type: LifelineType) => void;
  submitAnswer: () => void;
  startGame: () => void;
  advanceToNextQuestion: () => void;
  abandonGame: () => void;
}

const Game4Context = createContext<Game4ContextValue | undefined>(undefined);

export function Game4Provider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('lobby');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1); // Now dynamic from API
  const [googlyRating, setGooglyRating] = useState(50);
  const [currentQuestion, setCurrentQuestion] = useState<GooglyQuestion | null>(null);
  const [confidenceBet, setConfidenceBet] = useState<1 | 2 | 3 | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [usedLifelines, setUsedLifelines] = useState<Record<LifelineType, boolean>>({ '50_50': false, 'hint': false });
  const [revealResult, setRevealResult] = useState<RevealResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weakCategories, setWeakCategories] = useState<string[]>([]);

  // Local Storage Persistence
  useEffect(() => {
    const saved = sessionStorage.getItem('g4_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessionState !== 'lobby' && parsed.sessionState !== 'game_over') {
          setSessionId(parsed.sessionId);
          setSessionState(parsed.sessionState);
          setCurrentRound(parsed.currentRound);
          setTotalRounds(parsed.totalRounds || 1);
          setGooglyRating(parsed.googlyRating);
          setCurrentQuestion(parsed.currentQuestion);
          setUsedLifelines(parsed.usedLifelines || { '50_50': false, 'hint': false });
        }
      } catch (e) { console.error("Failed to parse session", e); }
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('g4_state', JSON.stringify({
        sessionId, sessionState, currentRound, totalRounds, googlyRating, currentQuestion, usedLifelines
      }));
    }
  }, [sessionId, sessionState, currentRound, totalRounds, googlyRating, currentQuestion, usedLifelines]);

  // Record progress to Next.js dashboard backend
  const recordProgress = async (payload: { pointsAwarded: number; summary: string; score: number; focusAreas: string[] }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;

    try {
      await apiRequest('/api/dashboard/activity', {
        method: 'POST',
        token,
      suppressErrors: true,
      body: {
          gameKey: 'game4',
          title: 'GOOGLY MASTER',
          score: payload.score,
          pointsAwarded: payload.pointsAwarded,
          summary: payload.summary,
          focusAreas: payload.focusAreas,
        },
      });
    } catch (error) {
      console.error('Failed to record game4 progress:', error);
    }
  };

  // 1. Fetch Question from Python Backend
  const loadQuestion = async (round: number) => {
    if (round > totalRounds && totalRounds > 1) {
      setSessionState('game_over');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/game4/question/${round}`);
      const result = await response.json();

      if (result.status === 'success') {
        setCurrentQuestion(result.data);
        setConfidenceBet(null);
        setSelectedOptionId(null);
        setOpenAnswer('');
        setHintText(null);
        setRevealResult(null);
        setTypewriterDone(false);
        
        const initialStates: Record<string, OptionState> = {};
        result.data.options?.forEach((opt: any) => initialStates[opt.id] = 'default');
        setOptionStates(initialStates);
        
        setSessionState('playing');
      } else if (result.message === "Game Over") {
        setSessionState('game_over');
      }
    } catch (error) {
      console.error("Failed to load question:", error);
    }
  };

  // 2. Start Session from Python Backend
  const startGame = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/game4/start', { method: 'POST' });
      const result = await response.json();
      
      if (result.status === 'success') {
        setSessionId(`g4_${Date.now()}`);
        setGooglyRating(result.data.startingRating);
        setTotalRounds(result.data.totalRounds);
        setCurrentRound(1);
        setUsedLifelines({ '50_50': false, 'hint': false });
        await loadQuestion(1);
      }
    } catch (error) {
      console.error("Start Game Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectOption = (id: string) => {
    if (sessionState !== 'playing' || !typewriterDone || optionStates[id] === 'eliminated') return;
    
    setSelectedOptionId(id);
    // TS FIX: Explicitly type `prev`
    setOptionStates((prev: Record<string, OptionState>) => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k] !== 'eliminated') next[k] = k === id ? 'selected' : 'default';
      });
      return next;
    });
  };

  // 3. Process Lifelines with Python Backend
  const useLifeline = async (type: LifelineType) => {
    if (!currentQuestion || usedLifelines[type]) return;

    try {
      const response = await fetch('http://localhost:5000/api/game4/lifeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, questionId: currentQuestion.id })
      });
      
      const result = await response.json();

      if (result.status === 'success') {
        // TS FIX: Explicitly type `prev`
        setUsedLifelines((prev: Record<LifelineType, boolean>) => ({ ...prev, [type]: true }));
        
        if (type === '50_50') {
          // TS FIX: Explicitly type `prev`
          setOptionStates((prev: Record<string, OptionState>) => {
            const newState = { ...prev };
            result.data.eliminated.forEach((id: string) => { newState[id] = 'eliminated'; });
            return newState;
          });
        } else if (type === 'hint') {
          setHintText(result.data.hintText);
        }
      }
    } catch (error) {
      console.error("Lifeline error:", error);
    }
  };

  // 4. Submit Answer for AI Evaluation to Python Backend
  const submitAnswer = async () => {
    if (!currentQuestion || isSubmitting) return;
    if (currentQuestion.type === 'mcq' && !selectedOptionId) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/game4/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOptionId,
          confidenceBet,
          currentRating: googlyRating
        })
      });
      
      const result = await response.json();

      if (result.status === 'success') {
        const evalData = result.data;
        
        setRevealResult({
          correctOptionId: evalData.correctOptionId,
          trapOptionId: evalData.trapOptionId,
          isCorrect: evalData.isCorrect,
          isTrap: evalData.isTrap,
          trapExplanation: evalData.trapExplanation,
          playerInsight: evalData.playerInsight,
          ratingDelta: evalData.ratingDelta,
          newRating: evalData.newRating,
          confidenceBonus: evalData.confidenceBonus,
          totalXpAwarded: evalData.totalXpAwarded
        });
        
        // TS FIX: Explicitly type `prev`
        setGooglyRating((prev: number) => Math.max(0, Math.min(100, evalData.newRating)));

        if (!evalData.isCorrect) {
          // TS FIX: Explicitly type `prev`
          setWeakCategories((prev: string[]) => Array.from(new Set([...prev, currentQuestion?.category || 'reasoning'])));
        }
        
        if (currentQuestion.type === 'mcq') {
          // TS FIX: Explicitly type `prev`
          setOptionStates((prev: Record<string, OptionState>) => {
            const res = { ...prev };
            res[evalData.correctOptionId] = 'correct';
            if (evalData.isTrap && selectedOptionId) res[selectedOptionId] = 'trap';
            return res;
          });
        }
        
        setSessionState('revealing');
      }
    } catch (error) {
      console.error("Evaluation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const advanceToNextQuestion = () => {
    if (currentRound >= totalRounds) {
      setSessionState('game_over');
      sessionStorage.removeItem('g4_state');
      void recordProgress({
        pointsAwarded: revealResult?.totalXpAwarded || 0,
        summary: revealResult?.playerInsight || 'GOOGLY MASTER session completed.',
        score: googlyRating,
        focusAreas: Array.from(new Set([...(weakCategories.length > 0 ? weakCategories : []), currentQuestion?.category || 'reasoning'])),
      });
    } else {
      setCurrentRound(prev => prev + 1);
      loadQuestion(currentRound + 1);
    }
  };

  const abandonGame = () => {
    sessionStorage.removeItem('g4_state');
  };

  return (
    <Game4Context.Provider value={{
      sessionId, sessionState, currentQuestion, currentRound, totalRounds, googlyRating,
      confidenceBet, selectedOptionId, openAnswer, optionStates, typewriterDone,
      hintText, usedLifelines, revealResult, isSubmitting,
      setConfidenceBet, selectOption, setOpenAnswer, setTypewriterDone,
      useLifeline, submitAnswer, startGame, advanceToNextQuestion, abandonGame
    }}>
      {children}
    </Game4Context.Provider>
  );
}

export const useGame4 = () => {
  const context = useContext(Game4Context);
  if (!context) throw new Error('useGame4 must be used within Game4Provider');
  return context;
};