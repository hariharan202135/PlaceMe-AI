'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  Terminal, ShieldCheck, Play, Send, ChevronLeft, 
  HelpCircle, CheckCircle2, XCircle, Info, RefreshCw, 
  Cpu, Code2, AlertTriangle, List, ArrowLeft, Lock, Unlock, Star, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ICodingProblem {
  _id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  companyTags?: string[];
}

export default function CodingPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<ICodingProblem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector state
  const [selectedDomain, setSelectedDomain] = useState('General Coding');
  const [activeSetIndex, setActiveSetIndex] = useState<number | null>(null);
  const [unlockedSets, setUnlockedSets] = useState<string[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockSetIndex, setUnlockSetIndex] = useState<number | null>(null);

  // UPI payment simulation state
  const [selectedUpiPlatform, setSelectedUpiPlatform] = useState('gpay');
  const [upiTxRef, setUpiTxRef] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Playground state
  const [activeProblem, setActiveProblem] = useState<any | null>(null);
  const [playgroundState, setPlaygroundState] = useState<'list' | 'editor'>('list');
  const [language, setLanguage] = useState<'python' | 'javascript' | 'c' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState('');
  
  // Custom execution state
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleError, setConsoleError] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [failedTestCase, setFailedTestCase] = useState<any | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchUnlockedSets();
    
    // Check if redirecting from Question Bank with a specific problemId
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const problemId = params.get('problemId');
      if (problemId) {
        handleOpenPlayground(problemId);
      }
    }
  }, []);

  useEffect(() => {
    if (activeSetIndex !== null) {
      fetchProblemsForSet(selectedDomain, activeSetIndex);
    }
  }, [selectedDomain, activeSetIndex]);

  const fetchUnlockedSets = async () => {
    try {
      const res = await api.get('/coding/problems');
      if (res.data.success) {
        setUnlockedSets(res.data.unlockedSets || []);
      }
    } catch (err) {
      console.error('Error fetching unlocked sets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemsForSet = async (domain: string, setIdx: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/coding/problems?domain=${encodeURIComponent(domain)}&setIndex=${setIdx}`);
      if (response.data.success) {
        setProblems(response.data.problems);
        setUnlockedSets(response.data.unlockedSets || []);
      }
    } catch (err) {
      console.error('Error loading problems list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Boilerplates for languages
  const boilerplates: Record<string, string> = {
    python: `# Write your python solution here. 
# Read inputs from stdin using input()
# Example:
# N = int(input().strip())
# print(N)
import sys

def main():
    # Write logic
    line = sys.stdin.read().strip()
    if not line:
        return
    print(line[::-1]) # reverse fallback

if __name__ == '__main__':
    main()
`,
    javascript: `// Write your JavaScript solution here
// Read inputs from stdin using fs.readFileSync(0, 'utf-8')
const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    console.log(input.split('').reverse().join(''));
}

main();
`,
    c: `#include <stdio.h>
#include <string.h>

int main() {
    char str[100];
    if (fgets(str, sizeof(str), stdin)) {
        str[strcspn(str, "\\n")] = 0; // strip newline
        int len = strlen(str);
        for(int i = len - 1; i >= 0; i--) {
            printf("%c", str[i]);
        }
        printf("\\n");
    }
    return 0;
}
`,
    cpp: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (getline(cin, s)) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    }
    return 0;
}
`,
    java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String s = sc.nextLine();
            StringBuilder sb = new StringBuilder(s);
            System.out.println(sb.reverse().toString());
        }
    }
}
`
  };

  const handleUpiAppClick = (appId: string) => {
    setSelectedUpiPlatform(appId);
    // Deep link to selected UPI app with prefilled parameters for ₹10
    window.location.href = `upi://pay?pa=9894995725@upi&pn=PlaceMeAI&am=10.00&cu=INR&tn=CodingSetUnlock`;
  };

  const handleSimulateCodingUnlock = async () => {
    if (!upiTxRef || upiTxRef.trim().length !== 12 || isNaN(Number(upiTxRef.trim()))) {
      alert('⚠️ Please enter a valid 12-digit UPI transaction reference / UTR number.');
      return;
    }

    setVerifyingPayment(true);
    try {
      // Simulate verification query loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await api.post('/coding/problems/unlock-set', {
        domain: selectedDomain,
        setIndex: unlockSetIndex,
        utr: upiTxRef.trim()
      });

      if (res.data.success) {
        setUnlockedSets(res.data.unlockedSets || []);
        setShowUnlockModal(false);
        setUpiTxRef('');
        const unlockedIndex = unlockSetIndex;
        setUnlockSetIndex(null);
        alert(`✨ UPI Transaction Verified Successfully! ₹10 payment confirmed. Unlocked Set ${unlockedIndex} for ${selectedDomain}.`);
        setActiveSetIndex(unlockedIndex);
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      alert(err.response?.data?.message || 'UPI transaction verification failed. Please try again.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleOpenPlayground = async (probId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/coding/problems/${probId}`);
      if (res.data.success) {
        setActiveProblem(res.data.problem);
        setCode(boilerplates[language]);
        setConsoleOutput('');
        setConsoleError('');
        setSubmissionStatus(null);
        setFailedTestCase(null);
        setPlaygroundState('editor');
      }
    } catch (err) {
      console.error('Error fetching problem details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize boilerplate when language changes
  useEffect(() => {
    if (activeProblem) {
      setCode(boilerplates[language]);
    }
  }, [language, activeProblem]);

  // Tab key interceptor for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      // Reposition cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleRunTrial = async () => {
    if (!activeProblem || isRunning) return;
    setIsRunning(true);
    setConsoleOutput('');
    setConsoleError('');
    setSubmissionStatus(null);
    setFailedTestCase(null);

    const payload = {
      code,
      language,
      customInput: customInput.trim() || undefined
    };

    try {
      const res = await api.post(`/coding/problems/${activeProblem._id}/run`, payload);
      if (res.data.success) {
        const runResult = res.data.runResult;
        setSubmissionStatus(runResult.status);
        if (runResult.stdout) setConsoleOutput(runResult.stdout);
        if (runResult.stderr) setConsoleError(runResult.stderr);
      }
    } catch (err: any) {
      setConsoleError(err.response?.data?.message || 'Execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!activeProblem || isSubmitting) return;
    setIsSubmitting(true);
    setConsoleOutput('');
    setConsoleError('');
    setSubmissionStatus(null);
    setFailedTestCase(null);

    const payload = { code, language };

    try {
      const res = await api.post(`/coding/problems/${activeProblem._id}/submit`, payload);
      if (res.data.success) {
        const sub = res.data.submission;
        setSubmissionStatus(sub.status);
        if (sub.status === 'Accepted') {
          setConsoleOutput('✨ All test cases passed successfully. Submission Accepted!');
        } else {
          setConsoleError(`❌ Failed with status: ${sub.status}`);
          if (sub.failedTestCaseDetails) {
            setFailedTestCase(sub.failedTestCaseDetails);
          }
        }
      }
    } catch (err: any) {
      setConsoleError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && playgroundState === 'list') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded-xl w-64" />
          <div className="h-4 bg-muted rounded-xl w-96" />
        </div>

        <div className="h-10 bg-muted rounded-xl w-full" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="p-6 border border-border bg-card/30 rounded-3xl h-48 space-y-3">
              <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
              <div className="h-6 bg-muted rounded w-2/3 mx-auto" />
              <div className="h-4 bg-muted rounded w-full mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ==================================================== */}
      {/* 1. PROBLEMS GRID STATE */}
      {/* ==================================================== */}
      {playgroundState === 'list' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Coding Practice Playground</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Master core programming algorithms and structures. Submit scripts to test correctness against hidden inputs.
            </p>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-emerald-500">
            <Sparkles className="w-4.5 h-4.5 animate-pulse text-emerald-500 flex-shrink-0" />
            <span>Solve 3 coding sets for free for any domain (TCS, General, Wipro, etc.). Sets 4 & 5 are Premium coding sets unlocked exclusively for active Premium subscribers!</span>
          </div>

          {/* Domain Selector Row */}
          <div className="flex overflow-x-auto pb-3 gap-2 border-b border-border scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent scroll-smooth">
            {[
              'General Coding',
              'TCS Coding',
              'Wipro Coding',
              'Infosys Coding',
              'Cognizant Coding',
              'Accenture Coding',
              'Capgemini Coding',
              'HCL Coding',
              'Tech Mahindra Coding'
            ].map(d => (
              <button
                key={d}
                onClick={() => {
                  setSelectedDomain(d);
                  setActiveSetIndex(null);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                  selectedDomain === d
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Active set selector or expanded problems list */}
          {activeSetIndex === null ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((setIdx) => {
                const isPremium = setIdx >= 4;
                const hasActiveSubscription = user?.subscription?.plan && 
                                              user.subscription.plan !== 'Free' && 
                                              user.subscription.status === 'active';
                const isUnlocked = !isPremium || hasActiveSubscription;
                return (
                  <div 
                    key={setIdx} 
                    className="p-6 border border-border bg-card/35 rounded-3xl text-center space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-1.5 mx-auto">
                        {!isUnlocked ? (
                          <Lock className="w-4 h-4 text-red-500" />
                        ) : (
                          <Unlock className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          Set {setIdx}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-black text-foreground">
                        {!isUnlocked ? '🔒 Premium Coding Set' : '🔓 Unlocked Coding Set'}
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold">
                        20 Coding Interview Questions
                      </p>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => setActiveSetIndex(setIdx)}
                        className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2 rounded-xl text-xs transition"
                      >
                        Open Set
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          window.location.href = '/dashboard/billing';
                        }}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Upgrade to Premium</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back to Sets Link */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveSetIndex(null)}
                  className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sets list</span>
                </button>
                <div className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-xl">
                  {selectedDomain} &gt; Set {activeSetIndex}
                </div>
              </div>

              {loading ? (
                <div className="min-h-[30vh] w-full flex items-center justify-center text-muted-foreground text-xs">
                  <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" />
                  <span>Loading set challenges...</span>
                </div>
              ) : problems.length === 0 ? (
                <div className="min-h-[30vh] w-full border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground text-xs p-6 space-y-2">
                  <span>No questions found in this set.</span>
                </div>
              ) : (
                <div className="border border-border bg-card/30 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-card/55 text-muted-foreground text-xs font-semibold">
                          <th className="p-4">Difficulty</th>
                          <th className="p-4">Topic</th>
                          <th className="p-4">Company Tags</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {problems.map((p) => (
                          <tr key={p._id} className="hover:bg-card/10">
                            <td className="p-4 font-bold text-xs">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                p.difficulty === 'Easy' 
                                  ? 'bg-emerald-500/10 text-emerald-500' 
                                  : p.difficulty === 'Medium' 
                                  ? 'bg-amber-500/10 text-amber-500' 
                                  : 'bg-red-500/10 text-red-500'
                              }`}>
                                {p.difficulty}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-xs text-foreground">{p.topic}</td>
                            <td className="p-4 text-xs">
                              <div className="flex flex-wrap gap-1">
                                {p.companyTags?.map((tag, idx) => (
                                  <span key={idx} className="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right text-xs">
                              <button
                                onClick={() => handleOpenPlayground(p._id)}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4.5 py-1.5 rounded-xl inline-flex items-center space-x-1 transition"
                              >
                                <Terminal className="w-3.5 h-3.5" />
                                <span>Solve Challenge</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. DUAL-PANEL IDE STATE */}
      {/* ==================================================== */}
      {playgroundState === 'editor' && activeProblem && (
        <div className="space-y-4">
          {/* Top header navigation panel */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <button
              onClick={() => setPlaygroundState('list')}
              className="text-xs font-semibold text-primary inline-flex items-center space-x-1 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Problems</span>
            </button>
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-foreground">Topic: {activeProblem.topic}</span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                activeProblem.difficulty === 'Easy' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : activeProblem.difficulty === 'Medium' 
                  ? 'bg-amber-500/10 text-amber-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {activeProblem.difficulty}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Problem specs */}
            <div className="border border-border bg-card/30 rounded-2xl p-6 lg:h-[72vh] h-[35vh] overflow-y-auto space-y-4">
              <h2 className="text-lg font-extrabold text-foreground border-b border-border pb-2">Description</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                {activeProblem.questionText}
              </div>
            </div>

            {/* Right: Coding workspace */}
            <div className="space-y-4 lg:h-[72vh] h-[55vh] flex flex-col justify-between">
              {/* Toolbar */}
              <div className="p-4 border border-border bg-card/35 rounded-2xl flex items-center justify-between text-xs flex-shrink-0">
                <span className="font-bold text-muted-foreground">Select Language Runtime:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-background border border-border p-1.5 rounded-lg outline-none font-bold text-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="c">C (GCC)</option>
                  <option value="cpp">C++ (G++)</option>
                  <option value="java">Java (JDK)</option>
                </select>
              </div>

              {/* Editor Code Text area */}
              <div className="flex-1 min-h-0 border border-border rounded-2xl overflow-hidden bg-zinc-950 p-4">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  className="w-full h-full bg-transparent text-emerald-400 font-mono text-xs outline-none resize-none leading-relaxed"
                  style={{ tabSize: 4 }}
                />
              </div>

              {/* Custom trial input & Console */}
              <div className="border border-border bg-card/35 rounded-2xl p-4 space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">Custom Execution Input:</span>
                  <span className="text-muted-foreground">Console Logs</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <textarea
                    rows={2}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter test inputs here (e.g. hello)..."
                    className="p-2 border border-border bg-background rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary font-mono resize-none text-foreground"
                  />

                  <div className="p-2 bg-background border border-border rounded-lg text-[10px] font-mono overflow-y-auto h-12 leading-relaxed text-muted-foreground">
                    {submissionStatus && (
                      <div className="mb-1">
                        <span className="font-bold text-foreground">Status: </span>
                        <span className={`font-black ${submissionStatus === 'Accepted' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {submissionStatus}
                        </span>
                      </div>
                    )}
                    {consoleOutput && <div className="text-emerald-400 font-semibold">{consoleOutput}</div>}
                    {consoleError && <div className="text-red-400 font-semibold">{consoleError}</div>}
                    
                    {failedTestCase && (
                      <div className="mt-1 space-y-1 p-1 bg-red-500/5 border border-red-500/10 rounded">
                        <div className="text-red-400">Failed on visible test case inputs: "{failedTestCase.input.trim()}"</div>
                        <div>Expected Output: "{failedTestCase.expectedOutput}"</div>
                        <div>Actual Output: "{failedTestCase.actualOutput}"</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Execution buttons */}
                <div className="flex justify-end space-x-2 text-xs">
                  <button
                    disabled={isRunning || isSubmitting}
                    onClick={handleRunTrial}
                    className="px-4 py-2 border border-border rounded-xl hover:bg-card text-muted-foreground font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Run Trial</span>
                  </button>

                  <button
                    disabled={isRunning || isSubmitting}
                    onClick={handleSubmitSolution}
                    className="px-5 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Submit Code</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulated ₹10 Checkout Payment Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative overflow-hidden text-center text-left">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Star className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1.5 text-center">
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block mx-auto">
                Premium Set Checkout
              </span>
              <h3 className="text-lg font-black text-foreground">Unlock Coding Set {unlockSetIndex}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gain access to 20 premium coding interview challenges for **{selectedDomain}**. Single set purchase is just **₹10**.
              </p>
            </div>

            {/* Step 1: Select UPI Platform */}
            <div className="space-y-2">
              <label className="text-[10.5px] font-bold text-muted-foreground block text-left">
                1. Select UPI App:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'gpay', label: 'GPay', color: 'border-blue-500 bg-blue-500/5' },
                  { id: 'phonepe', label: 'PhonePe', color: 'border-purple-500 bg-purple-500/5' },
                  { id: 'paytm', label: 'Paytm', color: 'border-cyan-500 bg-cyan-500/5' },
                  { id: 'bhim', label: 'BHIM', color: 'border-emerald-500 bg-emerald-500/5' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleUpiAppClick(p.id)}
                    className={`p-2 border rounded-xl text-center text-[10px] font-bold transition flex flex-col items-center justify-center space-y-1 ${
                      selectedUpiPlatform === p.id 
                        ? `${p.color} border-2 text-foreground` 
                        : 'border-border bg-background hover:bg-card/50 text-muted-foreground'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Display QR Code */}
            <div className="p-4 bg-background border border-border rounded-2xl flex flex-col items-center space-y-3">
              <div className="text-[10.5px] font-bold text-muted-foreground">
                2. Scan QR Code to pay ₹10:
              </div>
              <div className="p-2 bg-white border border-gray-200 rounded-xl shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=9894995725@upi&pn=PlaceMeAI&am=10.00&cu=INR&tn=CodingSetUnlock`)}`} 
                  alt="UPI QR Code" 
                  className="w-32 h-32"
                />
              </div>
              <div className="text-[10px] text-muted-foreground text-center font-semibold">
                Scan using any UPI App to transfer ₹10 to 9894995725
              </div>
            </div>

            {/* Step 3: Enter Transaction ID */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-muted-foreground block">
                3. Enter 12-Digit UPI Transaction/UTR Ref No. after transferring ₹10 to 9894995725:
              </label>
              <input
                type="text"
                maxLength={12}
                value={upiTxRef}
                onChange={(e) => setUpiTxRef(e.target.value)}
                placeholder="e.g. 123456789012"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                disabled={verifyingPayment}
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={verifyingPayment}
                onClick={handleSimulateCodingUnlock}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-60 flex items-center justify-center space-x-1.5"
              >
                {verifyingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying UPI UTR Reference...</span>
                  </>
                ) : (
                  <span>Verify & Unlock Set</span>
                )}
              </button>
              <button
                type="button"
                disabled={verifyingPayment}
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockSetIndex(null);
                  setUpiTxRef('');
                }}
                className="w-full bg-background border border-border hover:bg-card/50 text-foreground font-bold py-2.5 rounded-xl text-xs transition"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
