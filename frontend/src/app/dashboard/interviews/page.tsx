'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  UserCheck, ShieldCheck, Sparkles, AlertCircle, Info, 
  Send, Award, Play, ChevronRight, HelpCircle, CheckCircle2, 
  MessageSquare, BookOpen, Clock, RefreshCw 
} from 'lucide-react';

interface IInterview {
  _id: string;
  jobRole: string;
  questions: any[];
  overallScore: number;
  status: 'pending' | 'completed';
  evaluation?: {
    grammar: string;
    confidence: string;
    technical: string;
    suggestions: string;
  };
  createdAt: string;
}

export default function AIInterviewsPage() {
  const [interviews, setInterviews] = useState<IInterview[]>([]);
  const [loading, setLoading] = useState(true);

  // Active interview state
  const [activeInterview, setActiveInterview] = useState<any | null>(null);
  const [interviewState, setInterviewState] = useState<'list' | 'taking' | 'completed'>('list');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]); // { role: 'ai' | 'user', text: string, evaluation?: any }
  const [evaluating, setEvaluating] = useState(false);
  const [jobRoleInput, setJobRoleInput] = useState('Software Engineer');

  const [hasResume, setHasResume] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeSuccess, setResumeSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setResumeError('Please upload a PDF file only.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setResumeError('');
      setResumeSuccess('');
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadResume = async () => {
    if (!selectedFile) return;
    setUploadingResume(true);
    setResumeError('');
    setResumeSuccess('');

    try {
      const base64String = await getBase64(selectedFile);
      const payload = {
        file: base64String,
        fileName: selectedFile.name
      };

      const res = await api.post('/resume/analyze', payload);
      if (res.data.success) {
        setHasResume(true);
        setResumeSuccess('Resume processed! Personalized questions unlocked.');
        setSelectedFile(null);
      }
    } catch (err: any) {
      console.error('Error uploading resume inside interview:', err);
      setResumeError('Failed to process resume. Please try again.');
    } finally {
      setUploadingResume(false);
    }
  };

  useEffect(() => {
    fetchInterviewHistory();
    checkResumeStatus();
  }, []);

  const checkResumeStatus = async () => {
    try {
      const res = await api.get('/resume/history');
      if (res.data.success && res.data.history.length > 0) {
        setHasResume(true);
      }
    } catch (err) {
      console.error('Error checking resume status:', err);
    }
  };

  const fetchInterviewHistory = async () => {
    try {
      const response = await api.get('/interviews/history');
      if (response.data.success) {
        setInterviews(response.data.history);
      }
    } catch (err) {
      console.error('Error fetching interview logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!jobRoleInput.trim()) return;
    setLoading(true);

    try {
      const res = await api.post('/interviews/start', { jobRole: jobRoleInput });
      if (res.data.success) {
        const interviewData = res.data.interview;
        setActiveInterview(interviewData);
        setCurrentQIndex(0);
        setCurrentAnswer('');
        setInterviewState('taking');

        // Seed first question from AI
        const firstQuestion = interviewData.questions[0]?.question;
        setChatMessages([
          { 
            role: 'ai', 
            text: `Hello! Welcome to your mock HR interview for the role of ${jobRoleInput}. Let's begin. Here is your first question: \n\n"${firstQuestion}"`
          }
        ]);
      }
    } catch (err) {
      console.error('Error starting interview session:', err);
      alert('Error initiating AI interviewer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnswer.trim() || evaluating || !activeInterview) return;

    const userAnsText = currentAnswer.trim();
    // 1. Add user answer to chat stream
    setChatMessages(prev => [...prev, { role: 'user', text: userAnsText }]);
    setCurrentAnswer('');
    setEvaluating(true);

    try {
      // 2. Post answer to backend for evaluation
      const res = await api.post(`/interviews/${activeInterview._id}/answer`, {
        questionIndex: currentQIndex,
        answer: userAnsText
      });

      if (res.data.success) {
        const evalResult = res.data.evaluation;

        // 3. Add AI assessment feedback to chat stream
        setChatMessages(prev => [
          ...prev, 
          { 
            role: 'ai', 
            text: `📝 Evaluation for Question ${currentQIndex + 1}:\n• Score: ${evalResult.score}/10\n• Focus: ${evalResult.suggestions}\n\n💡 Ideal Response: "${evalResult.idealAnswer.slice(0, 150)}..."` 
          }
        ]);

        const nextIndex = currentQIndex + 1;
        if (nextIndex < activeInterview.questions.length) {
          // Trigger next question
          setTimeout(() => {
            setCurrentQIndex(nextIndex);
            const nextQuestion = activeInterview.questions[nextIndex].question;
            setChatMessages(prev => [
              ...prev,
              { role: 'ai', text: `Here is question ${nextIndex + 1}:\n\n"${nextQuestion}"` }
            ]);
          }, 1500);
        } else {
          // Final question completed. Terminate session
          setTimeout(handleCompleteInterview, 1500);
        }
      }
    } catch (err) {
      console.error('Error submitting answer evaluation:', err);
      setChatMessages(prev => [
        ...prev,
        { role: 'ai', text: '⚠️ Connection issue occurred during answer evaluation. Continuing session...' }
      ]);
    } finally {
      setEvaluating(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!activeInterview) return;
    setLoading(true);

    try {
      const res = await api.post(`/interviews/${activeInterview._id}/complete`);
      if (res.data.success) {
        setActiveInterview(res.data.interview);
        setInterviewState('completed');
      }
    } catch (err) {
      console.error('Error completing interview report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseInterview = () => {
    setInterviewState('list');
    setActiveInterview(null);
    setChatMessages([]);
    fetchInterviewHistory();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ==================================================== */}
      {/* 1. SELECTIONS / HISTORY STATE */}
      {/* ==================================================== */}
      {interviewState === 'list' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI HR Mock Interviewer</h1>
            <p className="text-sm text-muted-foreground">
              Select your targeted job role below. AI will ask professional HR screening questions and evaluate transcripts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Start Panel */}
            <div className="lg:col-span-1 border border-border bg-card/30 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold">New Mock Session</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Type your desired tech role (e.g. Software Developer, Data Scientist, Systems Architect, Associate Consultant).
              </p>

              <div className="space-y-4">
                {/* Resume personalization indicator */}
                {hasResume ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-500 rounded-xl p-3 text-xs flex items-start space-x-2 text-left">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold">Resume Personalized</span>
                      <p className="text-[10px] opacity-85 leading-relaxed">We will ask custom questions generated from your latest uploaded resume first!</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/35 text-amber-500 rounded-xl p-3 text-xs flex items-start space-x-2 text-left">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold">No Resume Uploaded</span>
                      <p className="text-[10px] opacity-85 leading-relaxed">Using generic questions. Upload your resume to unlock resume-personalized questions.</p>
                    </div>
                  </div>
                )}

                {/* Direct resume upload box */}
                <div className="border border-dashed border-border p-3.5 rounded-xl space-y-2.5 text-center bg-background/40">
                  <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
                    Upload Resume for Personalized Questions:
                  </span>
                  
                  <input
                    type="file"
                    accept=".pdf"
                    id="interview-resume-upload"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="interview-resume-upload"
                    className="cursor-pointer py-2 px-3 border border-border rounded-xl bg-card hover:bg-muted text-[10px] font-bold text-foreground inline-flex items-center space-x-1.5 transition w-full justify-center"
                  >
                    <span>{selectedFile ? selectedFile.name : 'Choose PDF Resume'}</span>
                  </label>

                  {selectedFile && (
                    <button
                      onClick={handleUploadResume}
                      disabled={uploadingResume}
                      className="w-full bg-primary/20 border border-primary/35 text-primary hover:bg-primary/30 font-bold py-2 rounded-xl text-[9px] transition flex items-center justify-center space-x-1 uppercase tracking-wider"
                    >
                      {uploadingResume ? 'Processing...' : 'Upload & Personalize'}
                    </button>
                  )}

                  {resumeError && <p className="text-[9px] text-red-400 font-semibold">{resumeError}</p>}
                  {resumeSuccess && <p className="text-[9px] text-emerald-400 font-semibold">{resumeSuccess}</p>}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                    Job Role / Profile
                  </label>
                  <input
                    type="text"
                    value={jobRoleInput}
                    onChange={(e) => setJobRoleInput(e.target.value)}
                    placeholder="e.g. Software Developer"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={handleStartInterview}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Interview</span>
                </button>
              </div>
            </div>

            {/* Past History Logs */}
            <div className="lg:col-span-2 border border-border bg-card/30 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold">Past Evaluation History</h3>
              <p className="text-xs text-muted-foreground">Logs of your completed AI screening reports.</p>

              {loading ? (
                <div className="space-y-3 pt-2 animate-pulse">
                  <div className="h-14 bg-muted/30 rounded-xl w-full" />
                  <div className="h-14 bg-muted/30 rounded-xl w-full" />
                  <div className="h-14 bg-muted/30 rounded-xl w-full" />
                </div>
              ) : interviews.length === 0 ? (
                <div className="border border-dashed border-border/80 bg-muted/10 p-10 rounded-2xl text-center max-w-md mx-auto space-y-4 my-4">
                  <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-inner">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-foreground">No Interview Logs Yet</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      Start your first AI HR interview session on the left to evaluate your confidence, technical logic, and grammar.
                    </p>
                  </div>
                  <div className="pt-1">
                    <span className="inline-flex items-center text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Ready to start
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-2">
                  {interviews.map((item) => (
                    <div 
                      key={item._id} 
                      className="p-4 border border-border bg-background rounded-xl flex items-center justify-between hover:border-primary/30 transition cursor-pointer"
                      onClick={() => {
                        setActiveInterview(item);
                        setInterviewState('completed');
                      }}
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">{item.jobRole}</h4>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()} • {item.questions?.length} Questions
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="text-right">
                          <span className="text-xs font-black text-primary block">{item.overallScore}% Score</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">Completed</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. ACTIVE CHAT DIALOGUE CONSOLE */}
      {/* ==================================================== */}
      {interviewState === 'taking' && activeInterview && (
        <div className="border border-border bg-card/30 rounded-2xl flex flex-col h-[70vh] overflow-hidden max-w-4xl mx-auto">
          {/* Chat header */}
          <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">HR Interview: {activeInterview.jobRole}</h3>
                <span className="text-[10px] text-muted-foreground">Question {currentQIndex + 1} of {activeInterview.questions?.length}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Evaluated in real-time</span>
            </div>
          </div>

          {/* Chat dialog messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/25">
            {chatMessages.map((msg, idx) => {
              const isAi = msg.role === 'ai';
              return (
                <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-4 rounded-2xl text-xs max-w-[85%] sm:max-w-[70%] whitespace-pre-line leading-relaxed ${
                    isAi 
                      ? 'bg-card/90 border border-border text-foreground rounded-tl-none font-medium'
                      : 'bg-primary text-primary-foreground rounded-tr-none font-semibold'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {evaluating && (
              <div className="flex justify-start">
                <div className="p-4 border border-border bg-card/75 text-xs text-muted-foreground rounded-2xl rounded-tl-none flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span>Gemini evaluating answer grammar and technical specificity...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input footer */}
          <form onSubmit={handleSendAnswer} className="p-4 border-t border-border bg-card/45 flex items-center space-x-3">
            <input
              type="text"
              required
              disabled={evaluating || interviewState !== 'taking'}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer professionally here..."
              className="flex-1 p-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={evaluating || !currentAnswer.trim() || interviewState !== 'taking'}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. REPORT / RESULTS STATE */}
      {/* ==================================================== */}
      {interviewState === 'completed' && activeInterview && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="border border-border bg-card/35 p-8 rounded-2xl relative overflow-hidden text-center sm:text-left">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/15 px-3 py-1 rounded-full">
                  <Award className="w-3.5 h-3.5" />
                  <span>AI Performance Card</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">HR Assessment: {activeInterview.jobRole}</h2>
                <p className="text-xs text-muted-foreground">Session terminated. Dynamic speech and logic metrics compiled successfully.</p>
              </div>

              {/* Total rating circle */}
              <div className="p-5 border border-border bg-background rounded-2xl text-center space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Readiness Rating</span>
                <span className="text-3xl font-black text-primary block">{activeInterview.overallScore}%</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold block mt-1 uppercase">Ready</span>
              </div>
            </div>
          </div>

          {/* Assessment metrics grid */}
          {activeInterview.evaluation && (
            <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold">Speech & Communication Assessment</h3>
              <p className="text-xs text-muted-foreground">Grammar coherence, subject matter expert index, and delivery tone check.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border border-border bg-background rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Grammar Coherence</span>
                  <p className="text-xs text-foreground font-medium leading-relaxed">{activeInterview.evaluation.grammar}</p>
                </div>
                <div className="p-4 border border-border bg-background rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Professional Confidence</span>
                  <p className="text-xs text-foreground font-medium leading-relaxed">{activeInterview.evaluation.confidence}</p>
                </div>
                <div className="p-4 border border-border bg-background rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Technical Specificity</span>
                  <p className="text-xs text-foreground font-medium leading-relaxed">{activeInterview.evaluation.technical}</p>
                </div>
              </div>

              <div className="mt-4 p-4 border border-border bg-background/50 rounded-xl text-xs space-y-1">
                <span className="font-bold text-primary flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>General Suggestions:</span>
                </span>
                <p className="text-muted-foreground leading-relaxed">{activeInterview.evaluation.suggestions}</p>
              </div>
            </div>
          )}

          {/* Transcript review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Interview Questions Transcript</h3>

            <div className="space-y-4.5">
              {activeInterview.questions?.map((q: any, idx: number) => (
                <div key={idx} className="p-6 border border-border bg-card/20 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground">
                      Q{idx + 1}. {q.question}
                    </h4>
                    <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Score: {q.score}/10
                    </span>
                  </div>

                  <div className="p-3 border border-border bg-background/60 rounded-xl text-xs space-y-1 text-muted-foreground">
                    <span className="font-semibold text-foreground text-xs block">Your Answer:</span>
                    <p className="italic leading-relaxed">"{q.answer || 'Unanswered.'}"</p>
                  </div>

                  {q.feedback && (
                    <div className="p-3 border border-amber-500/20 bg-amber-500/[0.02] rounded-xl text-xs space-y-1 text-muted-foreground">
                      <span className="font-semibold text-amber-500 text-xs block">Suggestions:</span>
                      <p className="leading-relaxed">{q.feedback}</p>
                    </div>
                  )}

                  {q.idealAnswer && (
                    <div className="p-3 border border-emerald-500/20 bg-emerald-500/[0.02] rounded-xl text-xs space-y-1 text-muted-foreground">
                      <span className="font-semibold text-emerald-500 text-xs block">Exemplar response:</span>
                      <p className="leading-relaxed">"{q.idealAnswer}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Close report button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleCloseInterview}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm transition shadow"
            >
              Close Evaluation report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
