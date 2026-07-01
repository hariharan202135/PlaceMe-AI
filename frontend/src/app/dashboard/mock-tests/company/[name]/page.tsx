'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  ArrowLeft, Clock, ShieldCheck, ChevronRight, Award, 
  HelpCircle, CheckCircle2, Info, Sparkles, BookOpen, Star, MessageSquare,
  Lock, Play
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ICompanyGuide {
  name: string;
  rounds: { name: string; count: number; time: string }[];
  description: string;
  difficulty: string;
  focusAreas: string[];
}

export default function CompanyPrepPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { name: nameRaw } = use(params);
  const companyName = decodeURIComponent(nameRaw);

  const [guide, setGuide] = useState<ICompanyGuide | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'syllabus' | 'aptitude' | 'technical' | 'hr' | 'tips' | 'mockTests'>('syllabus');

  // Local Q&A solutions reveals
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCompanyData();
  }, [companyName]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/prep/companies/${encodeURIComponent(companyName)}`);
      if (res.data.success) {
        setGuide(res.data.guide);
        setQuestions(res.data.questions || []);
        setMockTests(res.data.mockTests || []);
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('tcs')) return 'from-purple-500/10 to-violet-500/5 text-purple-500 border-purple-500/20';
    if (n.includes('wipro')) return 'from-blue-500/10 to-indigo-500/5 text-blue-500 border-blue-500/20';
    if (n.includes('infosys')) return 'from-amber-500/10 to-orange-500/5 text-amber-500 border-amber-500/20';
    if (n.includes('accenture')) return 'from-rose-500/10 to-pink-500/5 text-rose-500 border-rose-500/20';
    if (n.includes('cognizant')) return 'from-emerald-500/10 to-teal-500/5 text-emerald-500 border-emerald-500/20';
    return 'from-cyan-500/10 to-blue-500/5 text-cyan-500 border-cyan-500/20';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center text-muted-foreground text-xs">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" />
        <span>Loading company curriculum...</span>
      </div>
    );
  }

  const customHrQuestions = [
    {
      q: `Why do you want to join ${companyName}?`,
      ans: `An ideal response highlights ${companyName}'s work culture, major recent projects, and align with their values (e.g. innovation, client dedication). Explain how your learning goals match their trainee training programs.`
    },
    {
      q: `How do you handle technical disagreements during project sprints?`,
      ans: `Explain your logical approach to resolving conflict: listening to other opinions, validating performance constraints with prototypes, and aligning with the team leader's goals to maintain delivery speed.`
    },
    {
      q: `Where do you see yourself in 3 years within a consultancy environment?`,
      ans: `State your goal to master engineering structures, take ownership of specific module architectures, and transition toward senior tech lead or consultant roles.`
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      {/* Top navbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/mock-tests')}
            className="p-2 border border-border bg-card/25 rounded-xl hover:bg-card/50 transition text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Company Prep Hub</span>
            <h1 className="text-2xl font-black text-foreground">{guide?.name || companyName}</h1>
          </div>
        </div>

        {/* Readiness badge */}
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Active Practice</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {[
          { id: 'syllabus', name: 'Overview & Syllabus' },
          { id: 'aptitude', name: 'Aptitude Questions' },
          { id: 'technical', name: 'Technical Theory' },
          { id: 'hr', name: 'HR Interview Prep' },
          { id: 'mockTests', name: 'Mock Tests' },
          { id: 'tips', name: 'Preparation Tips' }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id as any)}
            className={`px-4 py-2 text-xs font-bold transition border-b-2 -mb-[2px] ${
              activeSubTab === subTab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {subTab.name}
          </button>
        ))}
      </div>

      {/* ==================================== */}
      {/* SUB-TAB: SYLLABUS & ROUNDS */}
      {/* ==================================== */}
      {activeSubTab === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Guide Info */}
            <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-3">
              <h3 className="font-bold text-lg">Placement Overview</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{guide?.description}</p>
              <div className="flex items-center space-x-4 pt-2 text-[11px] text-muted-foreground font-semibold">
                <span>Difficulty: <strong className="text-foreground">{guide?.difficulty}</strong></span>
              </div>
            </div>

            {/* Placement Rounds Timeline */}
            <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg">Syllabus & Recruitment Rounds</h3>
              <div className="space-y-3">
                {guide?.rounds?.map((round, idx) => (
                  <div key={idx} className="p-4 bg-background border border-border rounded-xl flex items-center justify-between gap-4 text-xs font-semibold">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <span className="text-foreground">{round.name}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-muted-foreground text-[10px]">
                      <span>{round.count} questions</span>
                      <span>•</span>
                      <span>{round.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-4">
              <h4 className="font-bold text-sm">Key Topics Syllabus</h4>
              <div className="flex flex-wrap gap-2">
                {guide?.focusAreas?.map((area, idx) => (
                  <span key={idx} className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* SUB-TAB: APTITUDE QUESTIONS */}
      {/* ==================================== */}
      {activeSubTab === 'aptitude' && (
        <div className="space-y-4">
          <div className="p-4 bg-background border border-border rounded-2xl text-xs flex items-start space-x-2 text-muted-foreground">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Review mock previous aptitude questions compiled from recent {companyName} placement papers.
            </p>
          </div>

          <div className="space-y-4">
            {questions.filter(q => q.topic !== 'Logical Reasoning' && q.topic !== 'Verbal Ability').map((q, idx) => (
              <div key={q._id} className="p-6 border border-border bg-card/30 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">Question {idx + 1} ({q.topic})</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded">
                    Accuracy Verified
                  </span>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-foreground">{q.questionText}</p>
                
                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {q.options.map((opt: string, optIdx: number) => {
                    const showCorrect = revealedSolutions[q._id];
                    const isCorrect = q.correctOption === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => setRevealedSolutions(p => ({ ...p, [q._id]: true }))}
                        className={`p-3 text-left border rounded-xl font-semibold transition ${
                          showCorrect
                            ? isCorrect
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                              : 'border-border bg-card/10'
                            : 'border-border bg-card/25 hover:bg-card/45'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {revealedSolutions[q._id] && q.explanation && (
                  <div className="p-4 bg-background border border-border rounded-xl text-xs space-y-1">
                    <span className="font-bold text-primary flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>Solution Details:</span>
                    </span>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* SUB-TAB: TECHNICAL THEORY */}
      {/* ==================================== */}
      {activeSubTab === 'technical' && (
        <div className="space-y-4">
          <div className="p-4 bg-background border border-border rounded-2xl text-xs flex items-start space-x-2 text-muted-foreground">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Revision MCQs mapping OOPs, Databases (DBMS), operating systems, and computer organization fundamentals.
            </p>
          </div>

          <div className="space-y-4">
            {questions.filter(q => q.topic === 'Logical Reasoning' || q.topic === 'Verbal Ability' || q.options.length > 0).slice(0, 4).map((q, idx) => (
              <div key={q._id} className="p-6 border border-border bg-card/30 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">Question {idx + 1} (Technical MCQ)</span>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                    Technical
                  </span>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-foreground">{q.questionText}</p>
                
                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {q.options.map((opt: string, optIdx: number) => {
                    const showCorrect = revealedSolutions[q._id];
                    const isCorrect = q.correctOption === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => setRevealedSolutions(p => ({ ...p, [q._id]: true }))}
                        className={`p-3 text-left border rounded-xl font-semibold transition ${
                          showCorrect
                            ? isCorrect
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                              : 'border-border bg-card/10'
                            : 'border-border bg-card/25 hover:bg-card/45'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {revealedSolutions[q._id] && q.explanation && (
                  <div className="p-4 bg-background border border-border rounded-xl text-xs space-y-1">
                    <span className="font-bold text-primary flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>Solution Details:</span>
                    </span>
                    <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* SUB-TAB: HR PREPARATION */}
      {/* ==================================== */}
      {activeSubTab === 'hr' && (
        <div className="space-y-4">
          <div className="p-4 bg-background border border-border rounded-2xl text-xs flex items-start space-x-2 text-muted-foreground">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Curated HR screening questions targeting {companyName} cultural fits and structural alignments.
            </p>
          </div>

          <div className="space-y-4">
            {customHrQuestions.map((item, idx) => (
              <div key={idx} className="p-6 border border-border bg-card/30 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-muted-foreground block">HR Question {idx + 1}</span>
                <h4 className="font-bold text-sm text-foreground">"{item.q}"</h4>
                <div className="p-4 bg-background border border-border rounded-xl text-xs space-y-1.5 leading-relaxed">
                  <span className="font-bold text-primary flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>How to Answer:</span>
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{item.ans}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* SUB-TAB: PREPARATION TIPS */}
      {/* ==================================== */}
      {activeSubTab === 'tips' && (
        <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold">General Tips & Strategic Recommendations</h3>
          
          <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
            <div className="p-4.5 bg-background border border-border rounded-xl space-y-1.5">
              <span className="font-bold text-foreground text-sm block">1. Focus on Time Management</span>
              <p>
                Most placement rounds do not carry negative markings. Attempt all questions! Divide your minutes equally: spend no more than 60 seconds on mathematical aptitude blocks.
              </p>
            </div>

            <div className="p-4.5 bg-background border border-border rounded-xl space-y-1.5">
              <span className="font-bold text-foreground text-sm block">2. Revise Pseudo-code Debugging</span>
              <p>
                For companies like Capgemini and Cognizant, expect pseudo-code tracing loops, static variables, and recursive functions. Revisit standard C/C++ operators and syntax blocks.
              </p>
            </div>

            <div className="p-4.5 bg-background border border-border rounded-xl space-y-1.5">
              <span className="font-bold text-foreground text-sm block">3. Practice DBMS and OS MCQ Sheets</span>
              <p>
                Infosys and Accenture ask multiple technical questions about SQL queries, database normalizations, networking subnets, and operating system scheduling parameters.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* SUB-TAB: MOCK TESTS */}
      {/* ==================================== */}
      {activeSubTab === 'mockTests' && (
        <div className="space-y-4">
          <div className="p-4 bg-background border border-border rounded-2xl text-xs flex items-start space-x-2 text-muted-foreground">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Take fully-simulated placement mock tests designed specifically for {companyName}. The first test is free, and subsequent tests require a subscription.
            </p>
          </div>

          <div className="space-y-3">
            {mockTests.map((test, index) => {
              const isLocked = test.isPremium && !(user?.subscription?.plan !== 'Free' && user?.subscription?.status === 'active');
              return (
                <div key={test._id} className="p-4 bg-card/25 border border-border rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        test.isPremium 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {test.isPremium ? 'Premium' : 'Free'}
                      </span>
                      <h4 className="font-extrabold text-sm text-foreground">{test.title}</h4>
                    </div>
                    <div className="flex items-center text-[10px] text-muted-foreground space-x-3">
                      <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {test.duration} Mins</span>
                      <span>Passing Score: 60%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isLocked) {
                        setShowPremiumModal(true);
                      } else {
                        router.push(`/dashboard/mock-tests?startTest=${test._id}`);
                      }
                    }}
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
