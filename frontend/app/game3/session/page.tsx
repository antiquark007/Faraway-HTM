'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame3 } from '../../../components/game3/Game3Context';
import { ConceptCard } from '../../../components/game3/ConceptCard';
import { CountdownRing } from '../../../components/game3/CountdownRing';
import { ScoreMeter } from '../../../components/game3/ScoreMeter';
import { Button } from '../../../components/ui/button';

export default function SessionPage() {
  const router = useRouter();
  const { 
    sessionConfig, sessionState, currentCard, currentRound, 
    timeRemaining, timerActive, inputMode, setInputMode, 
    answer, setAnswer, submitAnswer, evaluationResult, 
    advanceToNextCard, isEvaluating, livesRemaining, abandonGame, startGame,
    audioBlob, setAudioBlob
  } = useGame3();

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // --- SOUND ENGINE ---
  const playSound = (type: 'click' | 'success' | 'fail' | 'fahhh') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.play().catch((e) => console.log('Audio autoplay blocked or missing file', e));
    } catch (err) {
      // Ignore server-side execution errors
    }
  };

  useEffect(() => {
    if (sessionState === 'lobby') startGame();
  }, [sessionState, startGame]);

  // State-driven Sounds (Success, Fail, Game Over)
  useEffect(() => {
    if (sessionState === 'score_reveal' && evaluationResult) {
      playSound('success');
    } else if (sessionState === 'life_lost') {
      playSound('fail');
    } else if (sessionState === 'game_over' && livesRemaining <= 0) {
      playSound('fahhh'); // The legendary FAHHH!
    }
  }, [sessionState, evaluationResult, livesRemaining]);

  if (!sessionConfig || !currentCard) return null;

  const handleMicToggle = async () => {
    playSound('click');
    if (isRecording) {
      // 1. Stop raw audio
      mediaRecorderRef.current?.stop();
      // 2. Stop live transcript
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        setAudioBlob(null);
        setLiveTranscript(''); // Clear old transcript
        mediaRecorder.start();
        
        // --- NEW: Live Web Speech Transcript ---
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            setLiveTranscript(currentTranscript);
          };
          
          recognitionRef.current = recognition;
          recognition.start();
        } else {
          console.warn("Live transcript not supported in this browser, but audio is still recording.");
        }
        // --------------------------------------

        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied");
        setInputMode('text'); 
      }
    }
  };

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "var(--primary)" : "none"} stroke="var(--primary)" strokeWidth="2" className={filled ? '' : 'opacity-30'}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-muted flex flex-col pt-8 px-4 pb-20">
      
      {/* HUD Header */}
      <header className="max-w-3xl w-full mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-1">
          {Array.from({ length: sessionConfig.totalLives }).map((_, i) => (
            <HeartIcon key={i} filled={i < livesRemaining} />
          ))}
        </div>
        <div className="text-muted-foreground font-semibold uppercase tracking-widest text-sm">
          Round {currentRound} / {sessionConfig.totalRounds}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => { 
            playSound('click');
            abandonGame(); 
            router.push('/dashboard'); 
          }}
        >
          Quit
        </Button>
      </header>

      {/* Main Game Area */}
      <main className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="mb-8">
            <CountdownRing timeRemaining={timeRemaining} totalTime={sessionConfig.timePerRound} />
          </div>
          <div className="w-full">
            <ConceptCard card={currentCard} />
          </div>
        </div>

        {sessionState === 'playing' && (
          <div className="mt-auto animate-fade-in">
            <div className="flex justify-center mb-4 gap-2">
              <Button 
                variant={inputMode === 'mic' ? 'default' : 'outline'} 
                className="rounded-full"
                onClick={() => { playSound('click'); setInputMode('mic'); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                Speak Answer
              </Button>
              <Button 
                variant={inputMode === 'text' ? 'default' : 'outline'} 
                className="rounded-full"
                onClick={() => { playSound('click'); setInputMode('text'); }}
              >
                Type Answer
              </Button>
            </div>

            {inputMode === 'text' ? (
              <div className="relative">
                <textarea 
                  className="w-full bg-background border border-border rounded-[1rem] p-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-32"
                  placeholder="Start explaining your concept..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!timerActive}
                />
                <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
                  {answer.length} chars
                </div>
              </div>
            ) : (
              // --- THIS IS THE UPDATED RECORDING BOX ---
              <div className="flex flex-col items-center justify-center p-6 bg-background border border-border rounded-[1rem] min-h-[12rem]">
                <button 
                  onClick={handleMicToggle}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground shadow-lg transition-transform mb-4 ${isRecording ? 'bg-destructive animate-pulse scale-110' : 'bg-primary hover:scale-105'}`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/></svg>
                </button>
                <p className="text-sm font-semibold text-foreground mb-4">
                  {isRecording ? "Recording... Click mic to stop before submitting" : "Click to start speaking"}
                </p>
                
                {/* Live Transcript Box */}
                {(isRecording || liveTranscript) && (
                  <div className="w-full bg-muted/50 p-4 rounded-lg border border-border text-sm text-muted-foreground italic h-24 overflow-y-auto">
                    {liveTranscript || "Listening for your voice..."}
                  </div>
                )}
              </div>
            )}

            <Button 
              size="lg"
              className="w-full mt-4 h-12 rounded-[0.9rem] font-bold text-base"
              onClick={() => { playSound('click'); submitAnswer(); }}
              // --- SUBMIT IS NOW LOCKED WHILE RECORDING ---
              disabled={isRecording || (!answer && !audioBlob) || isEvaluating}
            >
              {isEvaluating ? 'Evaluating...' : (isRecording ? 'Stop Recording to Submit' : 'Submit Answer')}
            </Button>
          </div>
        )}

        {sessionState === 'score_reveal' && evaluationResult && (
          <div className="bg-background border border-border rounded-[1.25rem] p-6 mt-6 animate-slide-up shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">AI Evaluation</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                +{evaluationResult.xpAwarded} XP
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <ScoreMeter label="Clarity" score={evaluationResult.clarity} />
              <ScoreMeter label="Structure" score={evaluationResult.structure} />
              <ScoreMeter label="Depth" score={evaluationResult.depth} />
              <ScoreMeter label="Brevity" score={evaluationResult.brevity} />
            </div>

            <div className="p-4 bg-muted rounded-[1rem] border border-border mb-6">
              <p className="text-sm text-foreground font-medium leading-relaxed">
                "{evaluationResult.feedback}"
              </p>
            </div>

            <Button 
              size="lg"
              className="w-full h-12 rounded-[0.9rem] font-bold text-base"
              onClick={() => {
                playSound('click');
                if (currentRound >= sessionConfig.totalRounds) router.push('/dashboard');
                else advanceToNextCard();
              }}
            >
              {currentRound >= sessionConfig.totalRounds ? 'Finish Game' : 'Next Card →'}
            </Button>
          </div>
        )}
      </main>

      {sessionState === 'life_lost' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in px-4">
          <div className="bg-background border border-border rounded-[1.5rem] p-8 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 text-destructive">
              <HeartIcon filled={false} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Life Burned!</h2>
            <p className="text-muted-foreground mb-8">
              Your explanation didn't hit the mark. The interviewer was confused. You have {livesRemaining} lives left.
            </p>
            <Button 
              size="lg" 
              className="w-full h-12 rounded-[0.9rem] mb-3" 
              onClick={() => { playSound('click'); advanceToNextCard(); }}
            >
              Continue
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-12 rounded-[0.9rem]" 
              onClick={() => { playSound('click'); abandonGame(); router.push('/dashboard'); }}
            >
              Quit Game
            </Button>
          </div>
        </div>
      )}

      {sessionState === 'game_over' && livesRemaining <= 0 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in px-4">
          <div className="bg-background border border-border rounded-[1.5rem] p-8 max-w-sm w-full text-center shadow-2xl scale-100 transition-transform">
            
            <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            
            <h2 className="text-4xl font-extrabold text-destructive mb-3 uppercase tracking-wider">
              Game Over
            </h2>
            <p className="text-foreground text-lg font-medium mb-2">
              The interviewer disconnected.
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              You lost all 3 lives. Brush up on your concepts and try again!
            </p>
            
            <Button 
              size="lg" 
              className="w-full h-12 rounded-[0.9rem] font-bold" 
              onClick={() => {
                playSound('click');
                abandonGame(); 
                router.push('/dashboard'); 
              }}
            >
              Return to Dashboard
            </Button>
            
          </div>
        </div>
      )}

    </div>
  );
}