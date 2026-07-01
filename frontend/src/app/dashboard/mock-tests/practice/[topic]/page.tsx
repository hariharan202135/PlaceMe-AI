'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  ArrowLeft, Clock, Bookmark, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Info, Sparkles, RefreshCw
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
  isBookmarked?: boolean;
}

export default function TopicPracticePage({ params }: { params: Promise<{ topic: string }> }) {
  const router = useRouter();
  const { topic: topicRaw } = use(params);
  const topic = decodeURIComponent(topicRaw);

  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Quiz progress states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  
  // Timer tracking per topic session (counts up)
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    fetchTopicQuestions();
  }, [topic]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTopicQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/aptitude/practice/${encodeURIComponent(topic)}`);
      if (res.data.success) {
        setQuestions(res.data.questions);

        // Fetch user bookmarks state if any
        const bookmarksMap: Record<string, boolean> = {};
        res.data.questions.forEach((q: any) => {
          if (q.isBookmarked) {
            bookmarksMap[q._id] = true;
          }
        });
        setBookmarks(bookmarksMap);
      }
    } catch (err) {
      console.error('Error fetching practice questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: string, optionIdx: number) => {
    // Save selected option
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));

    // Instantly reveal solution on selection
    setRevealedSolutions(prev => ({
      ...prev,
      [qId]: true
    }));
  };

  const handleToggleBookmark = async (qId: string) => {
    try {
      const res = await api.post(`/prep/questions/${qId}/bookmark`);
      if (res.data.success) {
        setBookmarks(prev => ({
          ...prev,
          [qId]: !prev[qId]
        }));
      }
    } catch (err) {
      console.error('Error toggling bookmark status:', err);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rSecs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center text-muted-foreground text-xs">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" />
        <span>Compiling practice sheet...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">No Questions Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          No practice questions are currently seeded for "{topic}". Try selecting another topic from the dashboard.
        </p>
        <button
          onClick={() => router.push('/dashboard/mock-tests')}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalCorrect = Object.entries(selectedAnswers).filter(
    ([qId, ansIdx]) => ansIdx === questions.find(q => q._id === qId)?.correctOption
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header breadcrumb bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/mock-tests')}
            className="p-2 border border-border bg-card/25 rounded-xl hover:bg-card/50 transition text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Aptitude Practice</span>
            <h1 className="text-2xl font-black text-foreground">{topic}</h1>
          </div>
        </div>

        {/* Info badges */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 text-xs bg-card/30 border border-border px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold">{formatTimer(secondsElapsed)}</span>
          </div>
          
          <div className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 px-3 py-1.5 rounded-xl font-bold">
            Accuracy: {totalCorrect} / {Object.keys(selectedAnswers).length || 0} Correct
          </div>
        </div>
      </div>

      {/* Main Question Body console */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-3 border border-border bg-card/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                currentQ.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                currentQ.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {currentQ.difficulty}
              </span>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => handleToggleBookmark(currentQ._id)}
              className={`p-2 border rounded-xl transition ${
                bookmarks[currentQ._id]
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                  : 'border-border text-muted-foreground hover:bg-card'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>

          {/* Question text block */}
          <div className="p-4 bg-background/50 rounded-xl border border-border text-sm font-semibold leading-relaxed whitespace-pre-line text-foreground">
            {currentQ.questionText}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQ._id] === idx;
              const isCorrect = currentQ.correctOption === idx;
              const hasSelected = selectedAnswers[currentQ._id] !== undefined;

              let borderClass = 'border-border bg-card/25 text-muted-foreground';
              if (hasSelected) {
                if (isCorrect) borderClass = 'border-emerald-500 bg-emerald-500/15 text-emerald-500';
                else if (isSelected) borderClass = 'border-red-500 bg-red-500/15 text-red-500';
              } else if (isSelected) {
                borderClass = 'border-primary bg-primary/10 text-primary';
              }

              return (
                <button
                  key={idx}
                  disabled={hasSelected}
                  onClick={() => handleSelectOption(currentQ._id, idx)}
                  className={`w-full text-left p-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${borderClass} ${
                    !hasSelected && 'hover:bg-card/45'
                  }`}
                >
                  <span>{option}</span>
                  <div className="flex items-center space-x-1.5">
                    {hasSelected && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {hasSelected && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation panel (Revealed automatically once answered) */}
          {revealedSolutions[currentQ._id] && currentQ.explanation && (
            <div className="p-4 border border-border bg-background rounded-xl text-xs space-y-1.5 leading-relaxed">
              <span className="font-bold text-primary flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Step-by-step Solution:</span>
              </span>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between border-t border-border pt-6 text-xs">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-4 py-2 border border-border rounded-xl font-bold text-muted-foreground hover:bg-card disabled:opacity-50 transition"
            >
              Previous Question
            </button>
            <button
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl disabled:opacity-50 transition"
            >
              Next Question
            </button>
          </div>
        </div>

        {/* Question Selector List Sidebar */}
        <div className="border border-border bg-card/30 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-xs">Question Map</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q._id] !== undefined;
              const isCorrect = selectedAnswers[q._id] === q.correctOption;
              const isActive = currentIndex === idx;

              let btnClass = 'border-border text-muted-foreground bg-card/10';
              if (isAnswered) {
                btnClass = isCorrect 
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500' 
                  : 'border-red-500 bg-red-500/20 text-red-500';
              }
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

          <div className="border-t border-border pt-4 space-y-2 text-[10px] text-muted-foreground font-semibold">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
              <span>Correct Answer</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
              <span>Incorrect Answer</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded bg-card/10 border border-border" />
              <span>Unattempted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
