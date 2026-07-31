'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  UserCheck, ShieldCheck, Sparkles, AlertCircle, Info, 
  Send, Award, Play, ChevronRight, HelpCircle, CheckCircle2, 
  MessageSquare, BookOpen, Clock, RefreshCw, Mic, MicOff, Volume2, VolumeX,
  FileText, Download, TrendingUp, BarChart2, Check, XCircle, ArrowUpRight, Zap
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface IQuestionEvaluation {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  grammarScore: number;
  confidenceScore: number;
  relevanceScore: number;
  problemSolvingScore: number;
  professionalismScore: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  improvedAnswer: string;
  recommendation: 'Pass' | 'Borderline' | 'Fail';
  learningSuggestions: string[];
}

interface IChatMessage {
  id: string;
  sender: 'ai' | 'user';
  type: 'question' | 'answer' | 'evaluation' | 'system';
  text: string;
  evaluation?: IQuestionEvaluation;
  timestamp: string;
}

interface IInterview {
  _id: string;
  jobRole: string;
  questions: any[];
  overallScore: number;
  technicalScore?: number;
  communicationScore?: number;
  grammarScore?: number;
  confidenceScore?: number;
  relevanceScore?: number;
  problemSolvingScore?: number;
  professionalismScore?: number;
  recommendation?: 'Pass' | 'Borderline' | 'Fail';
  strengths?: string[];
  weaknesses?: string[];
  learningSuggestions?: string[];
  status: 'pending' | 'completed';
  createdAt: string;
}

export default function AIInterviewsPage() {
  const [interviews, setInterviews] = useState<IInterview[]>([]);
  const [loading, setLoading] = useState(true);

  // Active interview state
  const [activeInterview, setActiveInterview] = useState<IInterview | null>(null);
  const [interviewState, setInterviewState] = useState<'list' | 'taking' | 'report'>('list');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [jobRoleInput, setJobRoleInput] = useState('Software Engineer');

  // Resume Upload State
  const [hasResume, setHasResume] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeSuccess, setResumeSuccess] = useState('');

  // Speech Recognition (STT) State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech Synthesis (TTS) State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Timer State
  const [questionTimer, setQuestionTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setCurrentAnswer(prev => {
              // Append or update current input
              return prev ? `${prev} ${transcript}`.replace(/\s+/g, ' ') : transcript;
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (interviewState === 'taking' && !evaluating) {
      timerRef.current = setInterval(() => {
        setQuestionTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewState, evaluating, currentQIndex]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, evaluating]);

  const fetchInterviewHistory = async () => {
    try {
      const res = await api.get('/interviews/history');
      if (res.data.success) {
        setInterviews(res.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching interview history:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkResumeStatus = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.user) {
        setHasResume(true);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchInterviewHistory();
    checkResumeStatus();
  }, []);

  // Handle Speech Recognition Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic start error:', err);
      }
    }
  };

  // Handle Text-to-Speech (Read Aloud)
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Resume Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = (file.name || '').toLowerCase().split('.').pop();
      if (ext !== 'pdf' && ext !== 'doc' && ext !== 'docx') {
        setResumeError('Please upload a PDF (.pdf) or Word document (.doc, .docx).');
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

      const res = await api.post('/interviews/upload-resume', payload);
      if (res.data.success) {
        setHasResume(true);
        setResumeSuccess(res.data.message || 'Resume processed! Personalized HR questions unlocked.');
        setSelectedFile(null);
      }
    } catch (err: any) {
      console.error('Error uploading resume inside interview:', err);
      setResumeError(err.response?.data?.message || 'Failed to process resume. Please try again.');
    } finally {
      setUploadingResume(false);
    }
  };

  // Start Interview Session
  const handleStartInterview = async () => {
    if (!jobRoleInput.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/interviews/start', { jobRole: jobRoleInput });
      if (res.data.success && res.data.interview) {
        const session = res.data.interview;
        setActiveInterview(session);
        setInterviewState('taking');
        setCurrentQIndex(0);
        setQuestionTimer(0);
        setCurrentAnswer('');

        const firstQText = session.questions[0]?.question || `Welcome to your ${jobRoleInput} interview! Tell me about yourself and your background.`;

        const initialMessages: IChatMessage[] = [
          {
            id: 'msg-welcome',
            sender: 'ai',
            type: 'system',
            text: `🎯 Starting AI Mock Interview for **${jobRoleInput}**. I am your Senior Technical & HR Recruiter today. Answer each question clearly via text or voice mic!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: 'msg-q0',
            sender: 'ai',
            type: 'question',
            text: `Question 1: ${firstQText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];

        setChatMessages(initialMessages);

        if (autoSpeak) {
          speakText(firstQText);
        }
      }
    } catch (err) {
      console.error('Error starting interview session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit Current Answer
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !activeInterview || evaluating) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    stopSpeaking();

    const answerText = currentAnswer.trim();
    setCurrentAnswer('');
    setEvaluating(true);

    const userMsgId = `msg-ans-${Date.now()}`;
    const userMsg: IChatMessage = {
      id: userMsgId,
      sender: 'user',
      type: 'answer',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.post(`/interviews/${activeInterview._id}/answer`, {
        questionIndex: currentQIndex,
        answer: answerText
      });

      if (res.data.success) {
        const evaluation: IQuestionEvaluation = res.data.evaluation;

        const evalMsg: IChatMessage = {
          id: `msg-eval-${Date.now()}`,
          sender: 'ai',
          type: 'evaluation',
          text: `Evaluation for Question ${currentQIndex + 1}: Overall Score ${evaluation.overallScore}/10 (${evaluation.recommendation})`,
          evaluation,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, evalMsg]);

        const nextIndex = currentQIndex + 1;
        if (nextIndex < activeInterview.questions.length) {
          setCurrentQIndex(nextIndex);
          setQuestionTimer(0);

          const nextQText = activeInterview.questions[nextIndex].question;
          const nextQMsg: IChatMessage = {
            id: `msg-q-${nextIndex}`,
            sender: 'ai',
            type: 'question',
            text: `Question ${nextIndex + 1}: ${nextQText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setChatMessages(prev => [...prev, nextQMsg]);

          if (autoSpeak) {
            speakText(nextQText);
          }
        }
      }
    } catch (err) {
      console.error('Error evaluating answer:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // Complete Interview and Generate Final Report
  const handleCompleteInterview = async () => {
    if (!activeInterview) return;
    setLoading(true);
    try {
      const res = await api.post(`/interviews/${activeInterview._id}/complete`);
      if (res.data.success && res.data.interview) {
        setActiveInterview(res.data.interview);
        setInterviewState('report');
        fetchInterviewHistory();
      }
    } catch (err) {
      console.error('Error completing interview session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format Timer String (e.g. 01:45)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Download Printable Interview PDF Report
  const handleDownloadPDF = () => {
    window.print();
  };

  // Prepare chart data for history overview
  const chartData = interviews
    .slice()
    .reverse()
    .map((item, index) => ({
      session: `Interview #${index + 1}`,
      Overall: item.overallScore || 0,
      Technical: item.technicalScore || item.overallScore || 0,
      Communication: item.communicationScore || item.overallScore || 0,
      Confidence: item.confidenceScore || item.overallScore || 0
    }));

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card via-card/90 to-background border border-border p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ChatGPT Voice & Gemini HR Recruiter 2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI HR & Technical <span className="text-primary">Mock Interviewer</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Conduct realistic speech-enabled HR and technical interviews for top companies. Receive instant 8-category evaluations, STT voice input, TTS read-alouds, and PDF interview reports.
            </p>
          </div>

          {interviewState !== 'list' && (
            <button
              onClick={() => {
                stopSpeaking();
                setInterviewState('list');
                fetchInterviewHistory();
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-card/80 text-sm font-semibold transition"
            >
              <RefreshCw className="w-4 h-4 text-primary" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* STATE 1: LIST / DASHBOARD OVERVIEW                   */}
      {/* ---------------------------------------------------- */}
      {interviewState === 'list' && (
        <div className="space-y-8">
          {/* Start New Interview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass rounded-2xl p-6 border border-border space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Play className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Start New AI HR Interview</h2>
                    <p className="text-xs text-muted-foreground">Tailored role questions with real-time AI evaluation</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Target Job Role / Technology
                  </label>
                  <input
                    type="text"
                    value={jobRoleInput}
                    onChange={(e) => setJobRoleInput(e.target.value)}
                    placeholder="e.g. Software Engineer, Full Stack Developer, Data Scientist"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Popular Roles:</span>
                  {['Software Engineer', 'Full Stack Developer', 'Frontend Engineer', 'Java Developer', 'Data Analyst'].map(role => (
                    <button
                      key={role}
                      onClick={() => setJobRoleInput(role)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        jobRoleInput === role
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'border-border bg-card/40 hover:bg-card text-muted-foreground'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleStartInterview}
                  disabled={loading || !jobRoleInput.trim()}
                  className="w-full py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5" />
                      <span>Start Voice & Text Mock Interview</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resume Personalization Uplink */}
            <div className="glass rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-primary font-bold text-sm mb-2">
                  <FileText className="w-4 h-4" />
                  <span>Personalized Resume HR Questions</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload your resume (.pdf, .doc, .docx) to auto-extract technical project details and generate custom resume-specific HR questions!
                </p>

                {resumeSuccess && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{resumeSuccess}</span>
                  </div>
                )}

                {resumeError && (
                  <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{resumeError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="file"
                  id="interview-resume-file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="interview-resume-file"
                  className="w-full cursor-pointer flex items-center justify-center space-x-2 py-2.5 px-3 border border-dashed border-border hover:border-primary bg-card/40 hover:bg-card rounded-xl text-xs font-semibold text-foreground transition"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="truncate">{selectedFile ? selectedFile.name : 'Choose Resume (PDF, DOC, DOCX)'}</span>
                </label>

                {selectedFile && (
                  <button
                    onClick={handleUploadResume}
                    disabled={uploadingResume}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    {uploadingResume ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Process Resume & Customize Questions</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Score Improvement Chart */}
          {interviews.length > 0 && (
            <div className="glass rounded-2xl p-6 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Interview Performance Score Progression</span>
                </div>
                <span className="text-xs text-muted-foreground">{interviews.length} sessions completed</span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="session" stroke="#888888" fontSize={11} />
                    <YAxis domain={[0, 10]} stroke="#888888" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="Overall" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Technical" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Communication" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Confidence" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Past Interview History Table */}
          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <h3 className="text-base font-bold flex items-center space-x-2">
              <BookOpen className="w-4.5 h-4.5 text-primary" />
              <span>Past Interview History Log</span>
            </h3>

            {interviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No past interviews found. Click "Start New AI HR Interview" above to launch your first session!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Job Role</th>
                      <th className="py-3 px-4">Overall Score</th>
                      <th className="py-3 px-4">Recommendation</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {interviews.map((item) => (
                      <tr key={item._id} className="hover:bg-card/40 transition">
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">{item.jobRole}</td>
                        <td className="py-3.5 px-4 font-extrabold text-primary">{item.overallScore}/10</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.recommendation === 'Pass'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                : item.recommendation === 'Borderline'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-500 border border-red-500/30'
                            }`}
                          >
                            {item.recommendation || (item.overallScore >= 8 ? 'Pass' : item.overallScore >= 5 ? 'Borderline' : 'Fail')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveInterview(item);
                              setInterviewState('report');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-card/80 text-foreground font-semibold transition"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STATE 2: ACTIVE CHATGPT/GEMINI STYLE INTERVIEW RUN   */}
      {/* ---------------------------------------------------- */}
      {interviewState === 'taking' && activeInterview && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar Info */}
          <div className="lg:col-span-1 glass rounded-2xl p-5 border border-border space-y-6 h-fit">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Target Role</span>
              <h3 className="font-extrabold text-lg text-primary">{activeInterview.jobRole}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Question Progress</span>
                <span className="font-bold text-foreground">{currentQIndex + 1} / {activeInterview.questions.length}</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / activeInterview.questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Live Question Timer */}
            <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4.5 h-4.5 text-amber-400" />
                <span className="text-xs font-semibold">Answer Timer</span>
              </div>
              <span className="font-mono text-base font-bold text-amber-400">{formatTimer(questionTimer)}</span>
            </div>

            {/* Audio Voice Control Settings */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Auto-Read AI Questions</span>
                <button
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                    autoSpeak ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'
                  }`}
                >
                  {autoSpeak ? 'ON' : 'OFF'}
                </button>
              </div>

              {isSpeaking && (
                <div className="flex items-center justify-between text-xs text-primary animate-pulse">
                  <span>AI Recruiter Speaking...</span>
                  <button onClick={stopSpeaking} className="text-red-400 font-bold hover:underline">Stop</button>
                </div>
              )}
            </div>

            <button
              onClick={handleCompleteInterview}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow"
            >
              <Check className="w-4 h-4" />
              <span>Finish Interview & View Report</span>
            </button>
          </div>

          {/* Main ChatGPT Conversation Stream */}
          <div className="lg:col-span-3 glass rounded-2xl border border-border flex flex-col h-[75vh] overflow-hidden">
            {/* Chat Stream Header */}
            <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-sm">Live AI HR Interviewer Stream</span>
              </div>
              <span className="text-xs text-muted-foreground">Voice & Text Transcription Active</span>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm space-y-3 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : msg.type === 'system'
                      ? 'bg-card border border-border text-muted-foreground text-center w-full max-w-full'
                      : 'bg-card border border-border text-foreground rounded-bl-none'
                  }`}>
                    {/* Question Header & Speaker */}
                    {msg.type === 'question' && (
                      <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs font-semibold text-primary">
                        <span>AI Recruiter Question</span>
                        <button
                          onClick={() => speakText(msg.text.replace(/^Question \d+:\s*/, ''))}
                          className="p-1 hover:bg-primary/10 rounded transition"
                          title="Read Question Aloud"
                        >
                          <Volume2 className="w-4 h-4 text-primary" />
                        </button>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                    {/* Evaluation Breakdown Box inside Chat Stream */}
                    {msg.type === 'evaluation' && msg.evaluation && (
                      <div className="mt-3 p-4 bg-background/80 rounded-xl border border-border space-y-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-foreground">Score Breakdown</span>
                          <span className={`px-3 py-1 rounded-full font-extrabold text-xs ${
                            msg.evaluation.recommendation === 'Pass' ? 'bg-emerald-500/20 text-emerald-400' :
                            msg.evaluation.recommendation === 'Borderline' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            Recommendation: {msg.evaluation.recommendation}
                          </span>
                        </div>

                        {/* 8-Category Scores Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2 rounded-lg bg-card border border-border text-center">
                            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Technical</div>
                            <div className="text-sm font-extrabold text-emerald-400">{msg.evaluation.technicalScore}/10</div>
                          </div>
                          <div className="p-2 rounded-lg bg-card border border-border text-center">
                            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Communication</div>
                            <div className="text-sm font-extrabold text-amber-400">{msg.evaluation.communicationScore}/10</div>
                          </div>
                          <div className="p-2 rounded-lg bg-card border border-border text-center">
                            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Grammar</div>
                            <div className="text-sm font-extrabold text-indigo-400">{msg.evaluation.grammarScore}/10</div>
                          </div>
                          <div className="p-2 rounded-lg bg-card border border-border text-center">
                            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Confidence</div>
                            <div className="text-sm font-extrabold text-pink-400">{msg.evaluation.confidenceScore}/10</div>
                          </div>
                        </div>

                        {/* Feedback & Strengths/Weaknesses */}
                        {msg.evaluation.strengths && msg.evaluation.strengths.length > 0 && (
                          <div>
                            <span className="font-bold text-emerald-400 block mb-1">Strengths:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                              {msg.evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}

                        {msg.evaluation.weaknesses && msg.evaluation.weaknesses.length > 0 && (
                          <div>
                            <span className="font-bold text-red-400 block mb-1">Areas to Improve:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                              {msg.evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                        )}

                        {msg.evaluation.improvedAnswer && (
                          <div className="p-3 rounded-lg bg-card border border-primary/20 space-y-1">
                            <span className="font-bold text-primary block">Suggested Exemplar Response:</span>
                            <p className="text-muted-foreground leading-relaxed italic">{msg.evaluation.improvedAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] opacity-70 text-right">{msg.timestamp}</div>
                  </div>
                </div>
              ))}

              {evaluating && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl p-4 text-xs flex items-center space-x-3 text-primary animate-pulse">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>AI HR Recruiter is evaluating your answer...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Box Footer (Text Area + STT Mic Button) */}
            <div className="p-4 border-t border-border bg-card/60 space-y-3">
              {isListening && (
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold">Microphone Active – Speaking now...</span>
                  </div>
                  <button onClick={toggleListening} className="text-red-300 hover:underline text-[10px] font-bold uppercase">Click to stop</button>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-xl border transition flex-shrink-0 ${
                    isListening
                      ? 'bg-red-500 text-white border-red-400 animate-bounce'
                      : 'bg-card border-border hover:border-primary text-foreground'
                  }`}
                  title={isListening ? 'Stop Speech Recording' : 'Start Speech Recording (STT)'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-primary" />}
                </button>

                <textarea
                  rows={2}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder="Type your answer or click the microphone to speak..."
                  className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary resize-none font-medium"
                />

                <button
                  onClick={handleSubmitAnswer}
                  disabled={evaluating || !currentAnswer.trim()}
                  className="p-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition disabled:opacity-50 flex-shrink-0"
                  title="Send Answer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STATE 3: COMPREHENSIVE FINAL INTERVIEW REPORT       */}
      {/* ---------------------------------------------------- */}
      {interviewState === 'report' && activeInterview && (
        <div id="printable-interview-report" className="space-y-8 glass rounded-2xl p-6 sm:p-8 border border-border">
          {/* Printable Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Interview Session Completed</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Official Interview Evaluation Report: <span className="text-primary">{activeInterview.jobRole}</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Generated on {new Date(activeInterview.createdAt).toLocaleDateString()} for PlaceMe AI Candidate
              </p>
            </div>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs shadow-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Report as PDF</span>
            </button>
          </div>

          {/* Overall Score & Recommendation Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Overall Score</span>
              <div className="text-4xl font-black text-primary">{activeInterview.overallScore} <span className="text-lg text-muted-foreground font-normal">/ 10</span></div>
              <span className="text-xs text-muted-foreground font-medium">Aggregated across all answered questions</span>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Hiring Recommendation</span>
              <div className={`text-2xl font-black px-4 py-1.5 rounded-full ${
                activeInterview.recommendation === 'Pass' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                activeInterview.recommendation === 'Borderline' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}>
                {activeInterview.recommendation || (activeInterview.overallScore >= 8 ? 'Pass' : activeInterview.overallScore >= 5 ? 'Borderline' : 'Fail')}
              </div>
              <span className="text-xs text-muted-foreground font-medium">Based on professional evaluation rules</span>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-2">Category Score Breakdown</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Technical Accuracy:</span> <span className="font-bold">{activeInterview.technicalScore || activeInterview.overallScore}/10</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Communication Skills:</span> <span className="font-bold">{activeInterview.communicationScore || activeInterview.overallScore}/10</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Grammar & Framing:</span> <span className="font-bold">{activeInterview.grammarScore || activeInterview.overallScore}/10</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Confidence Level:</span> <span className="font-bold">{activeInterview.confidenceScore || activeInterview.overallScore}/10</span></div>
              </div>
            </div>
          </div>

          {/* Key Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-card border border-emerald-500/20 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Identified Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {activeInterview.strengths && activeInterview.strengths.length > 0 ? (
                  activeInterview.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <li>Demonstrated solid fundamental understanding of prompt requirements.</li>
                )}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-red-500/20 space-y-3">
              <h3 className="text-sm font-bold text-red-400 flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span>Areas for Improvement</span>
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {activeInterview.weaknesses && activeInterview.weaknesses.length > 0 ? (
                  activeInterview.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))
                ) : (
                  <li>Incorporate quantitative project outcomes and metrics into your answers.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Suggested Learning Topics */}
          {activeInterview.learningSuggestions && activeInterview.learningSuggestions.length > 0 && (
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Suggested Learning & Revision Topics</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeInterview.learningSuggestions.map((topic, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Per-Question Answer Logs */}
          <div className="space-y-4">
            <h3 className="text-base font-bold">Detailed Question & Evaluation Logs</h3>
            <div className="space-y-4">
              {activeInterview.questions.map((q, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-card border border-border space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-extrabold text-sm text-primary">Q{idx + 1}: {q.question}</span>
                    <span className="font-extrabold text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Score: {q.score}/10
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-muted-foreground uppercase block mb-1">Your Answer:</span>
                    <p className="p-3 rounded-xl bg-background border border-border text-foreground font-medium whitespace-pre-wrap">
                      {q.answer || 'No answer provided.'}
                    </p>
                  </div>

                  {q.feedback && (
                    <div>
                      <span className="font-semibold text-muted-foreground uppercase block mb-1">Feedback:</span>
                      <p className="text-muted-foreground leading-relaxed">{q.feedback}</p>
                    </div>
                  )}

                  {q.improvedAnswer && (
                    <div>
                      <span className="font-semibold text-emerald-400 uppercase block mb-1">Suggested Exemplar Response:</span>
                      <p className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-muted-foreground italic leading-relaxed">
                        {q.improvedAnswer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
