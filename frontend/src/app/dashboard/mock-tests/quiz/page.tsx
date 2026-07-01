'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  ArrowLeft, Clock, Bookmark, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Info, Sparkles, RefreshCw, Trophy
} from 'lucide-react';

interface IQuestion {
  _id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'MCQ';
  questionText: string;
  options: string[];
  correctOption: number;
  explanation?: string;
}

export default function RandomQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [quizState, setQuizState] = useState<'taking' | 'result'>('taking');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  
  // Timer (starts with 10 mins = 600 secs)
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    fetchRandomQuiz();
  }, []);

  useEffect(() => {
    if (quizState !== 'taking' || timeLeft <= 0) {
      if (quizState === 'taking' && timeLeft === 0) {
        setQuizState('result');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizState]);

  const fetchRandomQuiz = async () => {
    setLoading(true);
    try {
      const res = await api.get('/aptitude/random-quiz');
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      console.error('Error generating random quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: string, optionIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const toggleBookmark = (qId: string) => {
    setBookmarks(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rSecs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse pt-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="h-6 bg-muted rounded-lg w-1/3" />
          <div className="h-8 bg-muted rounded-xl w-24" />
        </div>
        {/* Workspace skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-28 bg-muted/40 rounded-2xl w-full" />
            <div className="space-y-2.5">
              <div className="h-12 bg-muted/30 rounded-xl w-full" />
              <div className="h-12 bg-muted/30 rounded-xl w-full" />
              <div className="h-12 bg-muted/30 rounded-xl w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-muted/30 rounded-2xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <div className="bg-red-500/10 text-red-500 p-3 rounded-full w-12 h-12 flex items-center justify-center">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Failed to Load Quiz</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There was a connection issue or no questions matching this category were found.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/mock-tests')}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4.5 py-2.5 rounded-xl text-xs transition shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const timeTaken = 600 - timeLeft;

  // Grade results locally
  const correctCount = questions.filter(q => answers[q._id] === q.correctOption).length;
  const incorrectCount = Object.keys(answers).length - correctCount;
  const unattemptedCount = questions.length - Object.keys(answers).length;
  const totalScore = correctCount * 10;
  const maxScore = questions.length * 10;
  const passPercent = (totalScore / maxScore) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* 1. QUIZ RUNNING CONSOLE */}
      {quizState === 'taking' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (confirm('Exit random quiz? Your progress will be discarded.')) {
                    router.push('/dashboard/mock-tests');
                  }
                }}
                className="p-2 border border-border bg-card/25 rounded-xl hover:bg-card/50 transition text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Cognitive Practice</span>
                <h1 className="text-2xl font-black text-foreground">Random Aptitude Quiz</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm bg-red-500/10 text-red-500 px-3.5 py-1.5 rounded-xl font-bold border border-red-500/15 self-start sm:self-auto">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            <div className="md:col-span-3 border border-border bg-card/30 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {currentQ.topic}
                  </span>
                </div>

                <button
                  onClick={() => toggleBookmark(currentQ._id)}
                  className={`p-2 border rounded-xl transition ${
                    bookmarks[currentQ._id]
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                      : 'border-border text-muted-foreground hover:bg-card'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              {/* Question Text */}
              <div className="p-4 bg-background/50 rounded-xl border border-border text-sm font-semibold leading-relaxed whitespace-pre-line text-foreground">
                {currentQ.questionText}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = answers[currentQ._id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(currentQ._id, idx)}
                      className={`w-full text-left p-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card/20 text-muted-foreground hover:bg-card/45'
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Nav */}
              <div className="flex justify-between border-t border-border pt-6 text-xs">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="px-4 py-2 border border-border rounded-xl font-bold text-muted-foreground hover:bg-card disabled:opacity-50 transition"
                >
                  Previous
                </button>

                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to submit your answers?')) {
                        setQuizState('result');
                      }
                    }}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition shadow"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar question list */}
            <div className="border border-border bg-card/30 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-xs">Quiz Progress</h3>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q._id] !== undefined;
                  const isMarked = bookmarks[q._id];
                  const isActive = currentIndex === idx;

                  let btnClass = 'border-border text-muted-foreground bg-card/10';
                  if (isAnswered) btnClass = 'border-primary bg-primary/20 text-primary';
                  if (isMarked) btnClass = 'border-amber-500 bg-amber-500/20 text-amber-500';
                  if (isActive) btnClass = 'border-primary bg-primary text-primary-foreground';

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-9 h-9 font-bold text-xs border rounded-lg transition ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. QUIZ GRADE REPORT */}
      {quizState === 'result' && (
        <div className="space-y-8">
          <div className="border border-border bg-card/30 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left relative z-10">
              <div className="md:col-span-2 space-y-2">
                <div className="inline-flex items-center space-x-1 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Trophy className="w-3.5 h-3.5 mr-1" />
                  <span>Quiz Summary</span>
                </div>
                <h2 className="text-2xl font-extrabold leading-tight">Random Aptitude Practice Result</h2>
                <p className="text-xs text-muted-foreground">Self-graded analysis completed. Review incorrect responses below.</p>
              </div>

              {/* Status */}
              <div className="p-4 border border-border bg-background/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Status</span>
                <span className={`text-lg font-bold block ${passPercent >= 60 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {passPercent >= 60 ? 'Passed' : 'Failed'}
                </span>
                <span className="text-[10px] text-muted-foreground block">Required: 60%</span>
              </div>

              {/* Grade */}
              <div className="p-4 border border-border bg-background/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Final Score</span>
                <span className="text-2xl font-black text-primary block">{totalScore} / {maxScore}</span>
                <span className="text-[10px] text-muted-foreground block">Time Taken: {formatTimer(timeTaken)}</span>
              </div>
            </div>

            {/* Score Grid details */}
            <div className="grid grid-cols-3 gap-4 border-t border-border mt-8 pt-6 text-center text-xs">
              <div>
                <span className="text-muted-foreground block">Correct</span>
                <span className="font-extrabold text-emerald-500 text-sm">{correctCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Incorrect</span>
                <span className="font-extrabold text-red-500 text-sm">{incorrectCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Unattempted</span>
                <span className="font-extrabold text-muted-foreground text-sm">{unattemptedCount}</span>
              </div>
            </div>
          </div>

          {/* Solutions key review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Solutions Review Key</h3>
            
            <div className="space-y-4.5">
              {questions.map((question, idx) => {
                const chosen = answers[question._id];
                const wasCorrect = chosen === question.correctOption;
                return (
                  <div 
                    key={idx} 
                    className={`p-6 border rounded-2xl space-y-4 ${
                      wasCorrect 
                        ? 'border-emerald-500/30 bg-emerald-500/[0.02]' 
                        : 'border-red-500/30 bg-red-500/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-sm leading-relaxed max-w-[90%]">
                        Q{idx + 1}. [{question.topic}] {question.questionText}
                      </h4>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        wasCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {wasCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* Options list showing selections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {question.options.map((opt: string, optIdx: number) => {
                        const isCorrectOption = optIdx === question.correctOption;
                        const isChosenOption = optIdx === chosen;
                        
                        let borderClass = 'border-border bg-card/25';
                        if (isCorrectOption) borderClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-500';
                        if (isChosenOption && !isCorrectOption) borderClass = 'border-red-500 bg-red-500/10 text-red-500';

                        return (
                          <div key={optIdx} className={`p-3 border rounded-xl font-medium ${borderClass}`}>
                            {opt} {isChosenOption && <span className="font-extrabold text-[10px] ml-1">(Your Choice)</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-4 p-4 border border-border bg-background rounded-xl text-xs space-y-1 leading-relaxed">
                        <span className="font-bold text-primary flex items-center space-x-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>Solution Explanation:</span>
                        </span>
                        <p className="text-muted-foreground whitespace-pre-line">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Close report button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => router.push('/dashboard/mock-tests')}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
