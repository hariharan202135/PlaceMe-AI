'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Trophy, Clock, Play, ArrowRight, ShieldCheck, 
  HelpCircle, ChevronLeft, ChevronRight, AlertCircle, 
  Bookmark, CheckCircle2, RefreshCw, XCircle, Info,
  BookOpen, Sparkles, Award, Star, ListCollapse, MessageSquare,
  Lock, Unlock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface IMockTest {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  questions: any[];
  totalMarks: number;
  passingMarks: number;
  companyTag?: string;
  isPremium?: boolean;
}

interface ITopic {
  name: string;
  totalQuestions: number;
  completionRate: number;
}

export default function PlacementMocksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'aptitude' | 'company' | 'tcs' | 'wipro'>('aptitude');
  
  // Lists
  const [tests, setTests] = useState<IMockTest[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active resumable test attempt states
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<IMockTest | null>(null);
  const [testState, setTestState] = useState<'list' | 'taking' | 'result'>('list');
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Attempt live progress states
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [timeTaken, setTimeTaken] = useState(0);

  // Result assessment report
  const [testResult, setTestResult] = useState<any | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Client-side search params checker (immune to Next.js pre-rendering build errors)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const startTestParam = params.get('startTest');
      if (startTestParam && tests.length > 0) {
        handleInitiateTest(startTestParam);
        // Wipe startTest query parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [tests]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch mock tests
      const resTests = await api.get('/mock-tests');
      if (resTests.data.success) {
        setTests(resTests.data.tests);
      }

      // 2. Fetch topics & completion progress
      const resTopics = await api.get('/aptitude/topics');
      if (resTopics.data.success) {
        setTopics(resTopics.data.topics);
      }

      // 3. Fetch attempt histories
      const resHistory = await api.get('/mock-tests/history');
      if (resHistory.data.success) {
        setHistory(resHistory.data.history);
      }
    } catch (err) {
      console.error('Error fetching mock tests dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown and state syncing
  useEffect(() => {
    if (testState !== 'taking' || timeLeft <= 0 || !activeAttemptId) {
      if (testState === 'taking' && timeLeft === 0) {
        handleAutoSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const nextTime = prev - 1;
        setTimeTaken(t => t + 1);

        // Auto-save test progress to backend every 15 seconds
        if (nextTime % 15 === 0 && nextTime > 0) {
          syncProgress(nextTime);
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testState, activeAttemptId]);

  const syncProgress = async (currentRemainingTime: number) => {
    if (!activeAttemptId) return;
    try {
      const payload = {
        answers: activeQuestions.map(q => ({
          questionId: q._id,
          chosenOption: answers[q._id]
        })),
        bookmarks: Object.entries(markedForReview)
          .filter(([_, isMarked]) => isMarked)
          .map(([qId]) => qId),
        remainingTime: currentRemainingTime,
        timeTaken: timeTaken
      };
      await api.post(`/mock-tests/${activeAttemptId}/save`, payload);
    } catch (err) {
      console.error('Error auto-saving mock test attempt progress:', err);
    }
  };

  // Start or resume test
  const handleInitiateTest = async (testId: string) => {
    // Client-side premium check
    const matchingTest = tests.find(t => t._id === testId);
    if (matchingTest?.isPremium) {
      const isSubscribed = user?.subscription?.plan !== 'Free' && user?.subscription?.status === 'active';
      if (!isSubscribed) {
        setShowPremiumModal(true);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.post(`/mock-tests/${testId}/start`);
      if (res.data.success) {
        const { attempt, questions } = res.data;
        
        setActiveAttemptId(attempt._id);
        setActiveTest(attempt.mockTest);
        setActiveQuestions(questions || []);
        
        // Re-construct options selected from active attempt payload
        const answersMap: Record<string, number> = {};
        attempt.answers.forEach((ans: any) => {
          if (ans.chosenOption !== undefined && ans.chosenOption !== null) {
            answersMap[ans.questionId] = ans.chosenOption;
          }
        });
        setAnswers(answersMap);

        const bookmarksMap: Record<string, boolean> = {};
        (attempt.bookmarks || []).forEach((bId: string) => {
          bookmarksMap[bId] = true;
        });
        setMarkedForReview(bookmarksMap);

        setTimeLeft(attempt.remainingTime || attempt.mockTest.duration * 60);
        setTimeTaken(attempt.timeTaken || 0);
        setCurrentQIndex(0);
        setTestState('taking');
      }
    } catch (err) {
      console.error('Error starting mock test attempt:', err);
      alert('Failed to initiate mock test attempt.');
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

  const toggleReview = (qId: string) => {
    setMarkedForReview(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitTest();
  };

  const handleSubmitTest = async () => {
    if (!activeAttemptId) return;
    setLoading(true);

    const payload = {
      answers: activeQuestions.map(q => ({
        questionId: q._id,
        chosenOption: answers[q._id]
      })),
      remainingTime: timeLeft,
      timeTaken: timeTaken
    };

    try {
      const res = await api.post(`/mock-tests/${activeAttemptId}/submit-attempt`, payload);
      if (res.data.success) {
        setTestResult(res.data.result);
        setAiFeedback(res.data.feedback || '');
        setTestState('result');
      }
    } catch (err) {
      console.error('Error submitting mock test:', err);
      alert('Error grading mock test attempt.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResults = () => {
    setTestState('list');
    setActiveTest(null);
    setTestResult(null);
    setActiveAttemptId(null);
    setAiFeedback('');
    fetchInitialData();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Find if user has any pending attempts
  const pendingAttempts = history.filter(h => h.status === 'Pending');

  if (loading && testState === 'list') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded-xl w-64" />
          <div className="h-4 bg-muted rounded-xl w-96" />
        </div>

        <div className="h-10 bg-muted rounded-xl w-80" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-border bg-card/30 p-6 rounded-2xl space-y-4 h-64">
              <div className="h-6 bg-muted rounded-lg w-2/3" />
              <div className="h-4 bg-muted rounded-lg w-full" />
              <div className="h-4 bg-muted rounded-lg w-5/6" />
              <div className="h-10 bg-muted rounded-xl w-full pt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ==================================================== */}
      {/* 1. EXAMS LIST STATE (TABS DASHBOARD) */}
      {/* ==================================================== */}
      {testState === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Placement Mock Tests</h1>
              <p className="text-sm text-muted-foreground">
                Prepare for engineering placements with simulated mock tests, company portals, and AI evaluations.
              </p>
            </div>
          </div>

          {/* Pending / Unfinished Sessions Panel */}
          {pendingAttempts.length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/[0.02] p-4.5 rounded-2xl space-y-3 text-left">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                ⚠️ Unfinished Quizzes / Tests
              </span>
              <div className="space-y-2">
                {pendingAttempts.map((attempt) => (
                  <div 
                    key={attempt._id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background border border-border rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{attempt.mockTest?.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Time Remaining: {formatTime(attempt.remainingTime || 0)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleInitiateTest(attempt.mockTest?._id)}
                      className="bg-amber-500 hover:bg-amber-500/90 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition"
                    >
                      Resume Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex border-b border-border bg-card/15 p-1 rounded-xl w-fit">
            {[
              { id: 'aptitude', name: 'General Aptitude' },
              { id: 'company', name: 'Company Prep' },
              { id: 'tcs', name: 'TCS Prep' },
              { id: 'wipro', name: 'Wipro Prep' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4.5 py-2.5 rounded-lg text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* ==================================== */}
          {/* TAB 1: GENERAL APTITUDE */}
          {/* ==================================== */}
          {activeTab === 'aptitude' && (
            <div className="max-w-2xl mx-auto border border-border bg-card/35 p-6 rounded-2xl space-y-6 text-left relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              <div className="space-y-2 relative z-10">
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full w-fit block uppercase tracking-wider">
                  Quantitative & Logical Practice
                </span>
                <h3 className="text-xl font-bold text-foreground">General Aptitude Mock Exam Center</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Evaluate your mathematical logic, verbal proficiency, and cognitive deduction skills. We provide 5 comprehensive mock tests. The first test is free, and other tests require a subscription.
                </p>
              </div>

              <div className="space-y-3 relative z-10">
                {tests.filter(t => t.companyTag === 'General Aptitude').map((test, index) => {
                  const isLocked = test.isPremium && !(user?.subscription?.plan !== 'Free' && user?.subscription?.status === 'active');
                  return (
                    <div key={test._id} className="p-4 bg-background border border-border rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            test.isPremium 
                              ? 'bg-amber-500/10 text-amber-500' 
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {test.isPremium ? 'Premium' : 'Free'}
                          </span>
                          <h4 className="font-extrabold text-sm">{test.title}</h4>
                        </div>
                        <div className="flex items-center text-[10px] text-muted-foreground space-x-3">
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-primary" /> {test.duration} Mins</span>
                          <span>Passing Score: 60%</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInitiateTest(test._id)}
                        className={`font-bold py-2 px-4.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow ${
                          isLocked
                            ? 'bg-muted border border-border text-muted-foreground cursor-not-allowed hover:bg-muted'
                            : 'bg-primary hover:bg-primary/95 text-primary-foreground'
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlock</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Test</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 2: COMPANY PREPARATION */}
          {/* ==================================== */}
          {activeTab === 'company' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'TCS', color: 'from-violet-500/10 to-purple-500/5', desc: 'NQT Numerical & Verbal coding sections' },
                { name: 'Wipro', color: 'from-blue-500/10 to-indigo-500/5', desc: 'Elite NTH Aptitude, Writing, and technicals' },
                { name: 'Infosys', color: 'from-amber-500/10 to-orange-500/5', desc: 'System Engineer cognitive & code evaluations' },
                { name: 'Accenture', color: 'from-rose-500/10 to-pink-500/5', desc: 'ASE & FSE critical cognitive analytical blocks' },
                { name: 'Cognizant', color: 'from-emerald-500/10 to-teal-500/5', desc: 'GenC Quantitative & debugging tests' },
                { name: 'Capgemini', color: 'from-cyan-500/10 to-blue-500/5', desc: 'Pseudo-code, game-based logic, and HR' },
                { name: 'HCL', color: 'from-sky-500/10 to-indigo-500/5', desc: 'Software Trainee aptitude and tech sheets' },
                { name: 'Tech Mahindra', color: 'from-red-500/10 to-orange-500/5', desc: 'Numerical scaling, coding logic, and HR rounds' }
              ].map((comp, idx) => (
                <div 
                  key={idx}
                  className="p-5 border border-border bg-card/30 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-primary/30 transition group text-left"
                >
                  <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${comp.color} rounded-full blur-xl group-hover:scale-125 transition duration-300`} />
                  
                  <div className="space-y-2 relative z-10">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Prep Card</span>
                    <h3 className="text-lg font-black text-foreground">{comp.name}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{comp.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (comp.name === 'TCS') setActiveTab('tcs');
                      else if (comp.name === 'Wipro') setActiveTab('wipro');
                      else router.push(`/dashboard/mock-tests/company/${encodeURIComponent(comp.name)}`);
                    }}
                    className="mt-6 w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold py-2 rounded-xl text-[11px] transition flex items-center justify-center space-x-1"
                  >
                    <span>Open Company Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 3: TCS PREPARATION */}
          {/* ==================================== */}
          {activeTab === 'tcs' && (
            <div className="space-y-6 text-left">
              <div className="border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-violet-500/5 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="space-y-1.5 relative z-10">
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block">Featured Dashboard</span>
                  <h2 className="text-xl font-extrabold text-foreground">TCS NQT Preparation Suite</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Practice TCS Quantitative Aptitude, Technical Questions, and attempt NQT full mock examinations.
                  </p>
                </div>
                
                {/* Visual scorecard indicator */}
                <div className="flex items-center space-x-3 bg-background/50 border border-border p-3 rounded-xl relative z-10">
                  <Award className="w-8 h-8 text-purple-500" />
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Readiness Rating</span>
                    <span className="font-extrabold text-sm text-foreground">TCS NQT Tier A</span>
                  </div>
                </div>
              </div>

              {/* Sub-cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* TCS specific resources */}
                <div className="lg:col-span-1 border border-border bg-card/35 p-6 rounded-2xl space-y-4 text-left">
                  <h3 className="font-bold text-base">TCS Training Modules</h3>
                  <p className="text-[11px] text-muted-foreground">Select subject topics filtered by TCS placement standards.</p>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => router.push('/dashboard/mock-tests/practice/Number System')}
                      className="w-full text-left p-3.5 bg-background border border-border rounded-xl hover:border-purple-500/40 text-xs font-semibold flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span>TCS Quantitative Practice</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>

                    <button 
                      onClick={() => router.push('/dashboard/mock-tests/practice/Logical Reasoning')}
                      className="w-full text-left p-3.5 bg-background border border-border rounded-xl hover:border-purple-500/40 text-xs font-semibold flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-purple-500" />
                        <span>TCS Logical Reasoning</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>

                    <button 
                      onClick={() => router.push('/dashboard/mock-tests/practice/Verbal Ability')}
                      className="w-full text-left p-3.5 bg-background border border-border rounded-xl hover:border-purple-500/40 text-xs font-semibold flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-purple-500" />
                        <span>TCS Verbal Ability Practice</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Mock Tests listing */}
                <div className="lg:col-span-2 border border-border bg-card/35 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-base">TCS Mock Exam Center</h3>
                  <p className="text-[11px] text-muted-foreground">Submit detailed full-length mock examinations to generate AI graded feedback. The first test is free, and other tests require a subscription.</p>

                  <div className="space-y-4">
                    {tests.filter(t => t.companyTag === 'TCS').map(test => {
                      const isLocked = test.isPremium && !(user?.subscription?.plan !== 'Free' && user?.subscription?.status === 'active');
                      return (
                        <div key={test._id} className="p-4 bg-background border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                test.isPremium 
                                  ? 'bg-amber-500/10 text-amber-500' 
                                  : 'bg-purple-500/10 text-purple-500'
                              }`}>
                                {test.isPremium ? 'Premium' : 'Free'}
                              </span>
                              <h4 className="font-extrabold text-sm">{test.title}</h4>
                            </div>
                            <div className="flex items-center text-[10px] text-muted-foreground space-x-3">
                              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {test.duration} Mins</span>
                              <span>Passing Score: {test.passingMarks}%</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleInitiateTest(test._id)}
                            className={`font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 transition ${
                              isLocked
                                ? 'bg-muted border border-border text-muted-foreground cursor-not-allowed'
                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" />
                                <span>Start Exam</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 4: WIPRO PREPARATION */}
          {/* ==================================== */}
          {activeTab === 'wipro' && (
            <div className="space-y-6 text-left">
              <div className="border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="space-y-1.5 relative z-10">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Featured Dashboard</span>
                  <h2 className="text-xl font-extrabold text-foreground">Wipro Elite NTH Preparation</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Practice Wipro specific cognitive papers, verbal structure questions, and Elite NTH Mock exams.
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 bg-background/50 border border-border p-3 rounded-xl relative z-10">
                  <Award className="w-8 h-8 text-blue-500" />
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Readiness Rating</span>
                    <span className="font-extrabold text-sm text-foreground">Wipro Elite Qualified</span>
                  </div>
                </div>
              </div>

              {/* Sub-cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wipro specific training modules */}
                <div className="lg:col-span-1 border border-border bg-card/35 p-6 rounded-2xl space-y-4 text-left">
                  <h3 className="font-bold text-base">Wipro Prep Resources</h3>
                  <p className="text-[11px] text-muted-foreground">Select prep resources matching Wipro guidelines.</p>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => router.push('/dashboard/mock-tests/practice/Time and Work')}
                      className="w-full text-left p-3.5 bg-background border border-border rounded-xl hover:border-blue-500/40 text-xs font-semibold flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>Wipro Aptitude Training</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>

                    <button 
                      onClick={() => router.push('/dashboard/mock-tests/practice/Logical Reasoning')}
                      className="w-full text-left p-3.5 bg-background border border-border rounded-xl hover:border-blue-500/40 text-xs font-semibold flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-blue-500" />
                        <span>Wipro Logical Reasoning</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>

                    <button 
                      onClick={() => router.push('/dashboard/mock-tests/practice/Verbal Ability')}
                      className="w-full text-left p-3.5 bg-background border border-border rounded-xl hover:border-blue-500/40 text-xs font-semibold flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span>Wipro Verbal Practice</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Mock exam center */}
                <div className="lg:col-span-2 border border-border bg-card/35 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-base">Wipro Mock Exam Center</h3>
                  <p className="text-[11px] text-muted-foreground">Take fully-simulated practice tests to benchmark placement rankings. The first test is free, and other tests require a subscription.</p>

                  <div className="space-y-4">
                    {tests.filter(t => t.companyTag === 'Wipro').map(test => {
                      const isLocked = test.isPremium && !(user?.subscription?.plan !== 'Free' && user?.subscription?.status === 'active');
                      return (
                        <div key={test._id} className="p-4 bg-background border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                test.isPremium 
                                  ? 'bg-amber-500/10 text-amber-500' 
                                  : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {test.isPremium ? 'Premium' : 'Free'}
                              </span>
                              <h4 className="font-extrabold text-sm">{test.title}</h4>
                            </div>
                            <div className="flex items-center text-[10px] text-muted-foreground space-x-3">
                              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {test.duration} Mins</span>
                              <span>Passing Score: {test.passingMarks}%</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleInitiateTest(test._id)}
                            className={`font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 transition ${
                              isLocked
                                ? 'bg-muted border border-border text-muted-foreground cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" />
                                <span>Start Exam</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. ACTIVE EXAM TAKING WINDOW */}
      {/* ==================================================== */}
      {testState === 'taking' && activeTest && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start text-left">
          {/* Main Question console */}
          <div className="lg:col-span-3 border border-border bg-card/30 rounded-2xl p-6 space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold truncate max-w-[280px] sm:max-w-md">{activeTest.title}</h2>
                <span className="text-xs text-muted-foreground">
                  Question {currentQIndex + 1} of {activeQuestions.length}
                </span>
              </div>

              {/* Running Timer */}
              <div className="flex items-center space-x-2 text-sm bg-red-500/10 text-red-500 px-3.5 py-1.5 rounded-xl font-bold border border-red-500/15">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Question Text */}
            {activeQuestions.length > 0 && (
              <div className="space-y-6">
                <div className="p-4 bg-background/50 rounded-xl border border-border text-sm font-semibold leading-relaxed whitespace-pre-line text-foreground">
                  {activeQuestions[currentQIndex]?.questionText}
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {activeQuestions[currentQIndex]?.options?.map((option: string, idx: number) => {
                    const qId = activeQuestions[currentQIndex]._id;
                    const isSelected = answers[qId] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(qId, idx)}
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
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-border pt-6 text-xs">
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleReview(activeQuestions[currentQIndex]._id)}
                  className={`px-4 py-2 border rounded-xl font-bold transition flex items-center space-x-1 ${
                    markedForReview[activeQuestions[currentQIndex]._id]
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                      : 'border-border text-muted-foreground hover:bg-card'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Mark for Review</span>
                </button>

                <button
                  onClick={() => {
                    const qId = activeQuestions[currentQIndex]._id;
                    setAnswers(prev => {
                      const copy = { ...prev };
                      delete copy[qId];
                      return copy;
                    });
                  }}
                  className="px-4 py-2 border border-border rounded-xl text-muted-foreground hover:bg-card font-semibold transition"
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className="p-2 border border-border rounded-xl text-muted-foreground hover:bg-card disabled:opacity-50 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {currentQIndex === activeQuestions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-5 py-2.5 rounded-xl transition"
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="p-2 border border-border rounded-xl text-muted-foreground hover:bg-card transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Grid Sidebar Selector */}
          <div className="border border-border bg-card/30 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm">Question Map</h3>
            <p className="text-[11px] text-muted-foreground">Select question number directly to jump positions.</p>

            <div className="grid grid-cols-5 gap-2.5">
              {activeQuestions.map((q, idx) => {
                const hasAnswered = answers[q._id] !== undefined;
                const isMarked = markedForReview[q._id];
                const isActive = currentQIndex === idx;

                let btnClass = 'border-border text-muted-foreground bg-card/10';
                if (hasAnswered) btnClass = 'border-primary bg-primary/20 text-primary';
                if (isMarked) btnClass = 'border-amber-500 bg-amber-500/20 text-amber-500';
                if (isActive) btnClass = 'border-primary bg-primary text-primary-foreground';

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-9 h-9 font-bold text-xs border rounded-lg transition ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend info */}
            <div className="border-t border-border pt-4 space-y-2 text-[10px] text-muted-foreground">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded bg-card/10 border border-border" />
                <span>Unattempted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. REPORT / RESULTS STATE (SWOT & AI FEEDBACK) */}
      {/* ==================================================== */}
      {testState === 'result' && testResult && activeTest && (
        <div className="space-y-8 text-left">
          {/* Summary Dashboard Banner */}
          <div className="border border-border bg-card/30 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left relative z-10">
              <div className="md:col-span-2 space-y-2">
                <div className="inline-flex items-center space-x-1 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <span>Scorecard Summary</span>
                </div>
                <h2 className="text-2xl font-extrabold leading-tight">{activeTest.title}</h2>
                <p className="text-xs text-muted-foreground">Completed. Correct answers details and solutions loaded below.</p>
              </div>

              {/* Status details */}
              <div className="p-4 border border-border bg-background/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Status</span>
                <div className="inline-flex items-center space-x-1">
                  {testResult.status === 'Pass' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-lg font-bold text-emerald-500">Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-lg font-bold text-red-500">Failed</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground block">Required passing: {activeTest.passingMarks}%</span>
              </div>

              {/* Grade details */}
              <div className="p-4 border border-border bg-background/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Accuracy Score</span>
                <span className="text-2xl font-black text-primary block">{testResult.totalScore}%</span>
                <span className="text-[10px] text-muted-foreground block">Percentile rank: {testResult.percentile}%</span>
              </div>
            </div>

            {/* Score Grid details */}
            <div className="grid grid-cols-3 gap-4 border-t border-border mt-8 pt-6 text-center text-xs">
              <div>
                <span className="text-muted-foreground block">Correct Answers</span>
                <span className="font-extrabold text-emerald-500 text-sm">{testResult.correctAnswers}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Incorrect Answers</span>
                <span className="font-extrabold text-red-500 text-sm">{testResult.incorrectAnswers}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Time Elapsed</span>
                <span className="font-extrabold text-foreground text-sm">{formatTime(testResult.timeTaken)}</span>
              </div>
            </div>
          </div>

          {/* Section Analytics Details */}
          <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-4">
            <h3 className="text-lg font-extrabold tracking-tight">Section-wise Accuracy Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Quantitative Aptitude', score: testResult.sectionScores?.aptitude },
                { name: 'Logical Reasoning', score: testResult.sectionScores?.logical },
                { name: 'Verbal Ability', score: testResult.sectionScores?.verbal }
              ].map((sec, idx) => (
                <div key={idx} className="p-4 border border-border bg-background rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {sec.name}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold">{sec.score !== undefined ? sec.score : 0}%</span>
                    <span className={`text-[10px] font-semibold ${sec.score >= 60 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {sec.score >= 60 ? 'Strength' : 'Improvement Required'}
                    </span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${sec.score >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${sec.score || 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI SWOT Feedback */}
          <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-4">
            <h3 className="text-lg font-extrabold tracking-tight flex items-center space-x-1.5">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>AI Grader Assessment & SWOT Advice</span>
            </h3>
            <div className="p-5 bg-background border border-border rounded-xl text-sm whitespace-pre-line leading-relaxed text-muted-foreground">
              {aiFeedback}
            </div>
          </div>

          {/* Solution key view */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Solutions Review Key</h3>
            
            <div className="space-y-4.5">
              {testResult.answers?.map((sol: any, idx: number) => {
                const question = activeQuestions.find(q => q._id.toString() === sol.questionId.toString());
                const wasCorrect = sol.isCorrect;
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
                        Q{idx + 1}. {question?.questionText}
                      </h4>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        wasCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {wasCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* Options list showing selections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {question?.options?.map((opt: string, optIdx: number) => {
                        const isCorrectOption = optIdx === question.correctOption;
                        const isChosenOption = optIdx === sol.chosenOption;
                        
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
                    {question?.explanation && (
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
              onClick={handleCloseResults}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm transition"
            >
              Back to Mock Tests
            </button>
          </div>
        </div>
      )}

      {/* Glassmorphism Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative overflow-hidden text-center text-left">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Premium Assessment Locked</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This mock test is part of our Premium Preparation package. Upgrade your account to unlock all 5 General Aptitude exams, 5 TCS/Wipro mock exams, and 5 specialist prep sheets per company.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowPremiumModal(false);
                  router.push('/dashboard/billing');
                }}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-xl text-xs transition animate-pulse"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowPremiumModal(false)}
                className="w-full bg-background border border-border hover:bg-card/50 text-foreground font-bold py-2.5 rounded-xl text-xs transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
