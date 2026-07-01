'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  BookOpen, Bookmark, BookmarkCheck, Search, Info, HelpCircle, 
  ChevronDown, RefreshCw, Star, ArrowRight, ShieldCheck, AlertCircle,
  Sparkles, Award, Terminal, Flame, BookMarked, Layers, CheckCircle2,
  Lock, Unlock, HelpCircle as QuestionIcon, ArrowUpRight, MessageSquare, Send
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface IQuestion {
  _id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'MCQ' | 'Coding';
  questionText: string;
  options?: string[];
  correctOption?: number;
  explanation?: string;
  companyTags?: string[];
  isBookmarked?: boolean;
  isSolved?: boolean;
  isAttempted?: boolean;
  isViewed?: boolean;
}

const getInteractiveSolutionCode = (topic: string, questionText: string) => {
  const tLower = topic.toLowerCase();
  if (tLower.includes('lcm') || tLower.includes('gcd')) {
    return {
      explanation: "We can find the Greatest Common Divisor (GCD) using the Euclidean algorithm, and then compute the Least Common Multiple (LCM) using the formula: LCM(a, b) = (a * b) / GCD(a, b).",
      cpp: `#include <iostream>\nusing namespace std;\n\nlong long gcd(long long a, long long b) {\n    return b == 0 ? a : gcd(b, a % b);\n}\n\nlong long lcm(long long a, long long b) {\n    return (a / gcd(a, b)) * b;\n}\n\nint main() {\n    long long a, b;\n    if (cin >> a >> b) {\n        cout << lcm(a, b) << endl;\n    }\n    return 0;\n}`,
      python: `def gcd(a, b):\n    return a if b == 0 else gcd(b, a % b)\n\ndef lcm(a, b):\n    return (a * b) // gcd(a, b)\n\n# Read inputs\ntry:\n    line = input().strip()\n    if line:\n        a, b = map(int, line.split())\n        print(lcm(a, b))\nexcept:\n    pass`,
      java: `import java.util.Scanner;\n\npublic class Solution {\n    public static long gcd(long a, long b) {\n        return b == 0 ? a : gcd(b, a % b);\n    }\n    public static long lcm(long a, long b) {\n        return (a / gcd(a, b)) * b;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long a = sc.nextLong();\n            long b = sc.nextLong();\n            System.out.println(lcm(a, b));\n        }\n    }\n}`
    };
  }
  
  if (tLower.includes('palindrome')) {
    return {
      explanation: "A string is a palindrome if it reads the same forward and backward. We can verify it using two-pointers meeting at the center.",
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    int left = 0, right = s.length() - 1;\n    while (left < right) {\n        if (s[left] != s[right]) return false;\n        left++;\n        right--;\n    }\n    return true;\n}`,
      python: `def is_palindrome(s):\n    return s == s[::-1]\n\ns = input().strip()\nprint("true" if is_palindrome(s) else "false")`,
      java: `import java.util.Scanner;\n\npublic class Solution {\n    public static boolean isPalindrome(String s) {\n        int i = 0, j = s.length() - 1;\n        while (i < j) {\n            if (s.charAt(i) != s.charAt(j)) return false;\n            i++;\n            j--;\n        }\n        return true;\n    }\n}`
    };
  }

  if (tLower.includes('fibonacci')) {
    return {
      explanation: "Fibonacci numbers are computed iteratively to avoid O(2^N) recursion limit. We store the previous two states to compute the next in O(N) time and O(1) space.",
      cpp: `#include <iostream>\nusing namespace std;\n\nlong long fibonacci(int n) {\n    if (n <= 1) return n;\n    long long prev2 = 0, prev1 = 1, curr = 0;\n    for (int i = 2; i <= n; i++) {\n        curr = prev1 + prev2;\n        prev2 = prev1;\n        prev1 = curr;\n    }\n    return curr;\n}`,
      python: `def fibonacci(n):\n    if n <= 1: return n\n    p2, p1 = 0, 1\n    for _ in range(2, n + 1):\n        curr = p1 + p2\n        p2 = p1\n        p1 = curr\n    return p1`,
      java: `public class Solution {\n    public static long fibonacci(int n) {\n        if (n <= 1) return n;\n        long p2 = 0, p1 = 1, curr = 0;\n        for (int i = 2; i <= n; i++) {\n            curr = p1 + p2;\n            p2 = p1;\n            p1 = curr;\n        }\n        return curr;\n    }\n}`
    };
  }

  if (tLower.includes('factorial')) {
    return {
      explanation: "Factorial of a number is the product of all positive integers less than or equal to n. We compute it iteratively using a simple loop.",
      cpp: `#include <iostream>\nusing namespace std;\n\nlong long factorial(int n) {\n    long long fact = 1;\n    for (int i = 1; i <= n; i++) fact *= i;\n    return fact;\n}`,
      python: `def factorial(n):\n    res = 1\n    for i in range(1, n + 1):\n        res *= i\n    return res`,
      java: `public class Solution {\n    public static long factorial(int n) {\n        long res = 1;\n        for (int i = 1; i <= n; i++) res *= i;\n        return res;\n    }\n}`
    };
  }

  if (tLower.includes('prime')) {
    return {
      explanation: "To verify if a number is prime, we check divisibility up to square root of N, running in O(sqrt(N)) complexity.",
      cpp: `#include <iostream>\nusing namespace std;\n\nbool isPrime(int n) {\n    if (n <= 1) return false;\n    for (int i = 2; i * i <= n; i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}`,
      python: `def is_prime(n):\n    if n <= 1: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0: return False\n    return True`,
      java: `public class Solution {\n    public static boolean isPrime(int n) {\n        if (n <= 1) return false;\n        for (int i = 2; i * i <= n; i++) {\n            if (n % i == 0) return false;\n        }\n        return true;\n    }\n}`
    };
  }

  return {
    explanation: "We can solve this problem iteratively by keeping pointers or tracking elements through a standard looping construct.",
    cpp: `// C++ implementation\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid solve() {\n    // Core logic goes here\n}`,
    python: `# Python implementation\ndef solve():\n    # Core logic goes here\n    pass`,
    java: `// Java implementation\npublic class Solution {\n    public static void main(String[] args) {\n        // Core logic goes here\n    }\n}`
  };
};

export default function QuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSolutionLang, setActiveSolutionLang] = useState<'cpp' | 'python' | 'java'>('cpp');

  // Stats & Progress tracking
  const [overallStats, setOverallStats] = useState<any>({
    allCodingCount: 500,
    solvedCount: 0,
    bookmarksCount: 0
  });
  const [lastViewed, setLastViewed] = useState<any>(null);
  const [dailyQuestion, setDailyQuestion] = useState<IQuestion | null>(null);

  // Filters state
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedDiff, setSelectedDiff] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [solvedStatus, setSolvedStatus] = useState('All'); // 'All', 'Solved', 'Unsolved', 'Bookmarked'
  const [searchQuery, setSearchQuery] = useState('');

  // Toggled panels maps
  const [openSolutionId, setOpenSolutionId] = useState<string | null>(null);
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'solution' | 'ai-explain' | 'ai-interview' | 'related'>>({});

  // AI Explanation cache
  const [aiExplanations, setAiExplanations] = useState<Record<string, any>>({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // AI Interview follow-up chat histories
  const [activeFollowUpId, setActiveFollowUpId] = useState<string | null>(null);
  const [followUpChatHistory, setFollowUpChatHistory] = useState<Record<string, Array<{role: 'user' | 'model', parts: string}>>>({});
  const [userMessage, setUserMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchDailyChallenge();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCompany, selectedCat, selectedDiff, selectedType, solvedStatus, searchQuery]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [followUpChatHistory, activeFollowUpId, sendingMessage]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/prep/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchDailyChallenge = async () => {
    try {
      const res = await api.get('/prep/questions/daily-challenge/today');
      if (res.data.success) {
        setDailyQuestion(res.data.question);
      }
    } catch (err) {
      console.error('Error loading daily challenge:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    const params: any = {};
    if (selectedCat) params.categoryId = selectedCat;
    if (selectedDiff) params.difficulty = selectedDiff;
    if (selectedType) params.type = selectedType;
    if (searchQuery) params.search = searchQuery;
    if (selectedCompany !== 'All') params.company = selectedCompany;

    // Apply solved/unsolved/bookmarked logic
    if (solvedStatus === 'Solved') params.solved = 'true';
    if (solvedStatus === 'Unsolved') params.unsolved = 'true';
    if (solvedStatus === 'Bookmarked') params.bookmarked = 'true';

    try {
      const res = await api.get('/prep/questions', { params });
      if (res.data.success) {
        setQuestions(res.data.questions);
        if (res.data.stats) {
          setOverallStats(res.data.stats);
        }
        if (res.data.lastViewed) {
          setLastViewed(res.data.lastViewed);
        }
      }
    } catch (err) {
      console.error('Error loading questions list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (qId: string) => {
    try {
      const res = await api.post(`/prep/questions/${qId}/bookmark`);
      if (res.data.success) {
        setQuestions(prev => prev.map(q => {
          if (q._id === qId) {
            return { ...q, isBookmarked: res.data.bookmarked };
          }
          return q;
        }));
        // Update stats bookmarks count
        setOverallStats((prev: any) => ({
          ...prev,
          bookmarksCount: res.data.bookmarked ? prev.bookmarksCount + 1 : Math.max(0, prev.bookmarksCount - 1)
        }));
      }
    } catch (err) {
      console.error('Error bookmarking question:', err);
    }
  };

  const handleOpenQuestionDetails = async (qId: string) => {
    // Record view in backend
    try {
      const res = await api.get(`/prep/questions/${qId}?companyContext=${encodeURIComponent(selectedCompany)}`);
      if (res.data.success && res.data.question) {
        // Update local state lastViewed
        setLastViewed({
          question: res.data.question,
          company: selectedCompany !== 'All' ? selectedCompany : (res.data.question.companyTags?.[0] || 'General Coding')
        });
      }
    } catch (err) {
      console.error('Error registering viewed question:', err);
    }
  };

  const toggleSolutionTab = (qId: string, tab: 'solution' | 'ai-explain' | 'ai-interview' | 'related') => {
    if (openSolutionId === qId && activeTabMap[qId] === tab) {
      setOpenSolutionId(null);
      return;
    }

    setOpenSolutionId(qId);
    setActiveTabMap(prev => ({
      ...prev,
      [qId]: tab
    }));

    handleOpenQuestionDetails(qId);

    if (tab === 'ai-explain') {
      fetchAIExplanation(qId);
    } else if (tab === 'ai-interview') {
      handleInitiateFollowUp(qId);
    }
  };

  const fetchAIExplanation = async (qId: string) => {
    if (aiExplanations[qId]) return; // already loaded
    setLoadingExplanation(true);
    try {
      const res = await api.post(`/prep/questions/${qId}/ai-explain`);
      if (res.data.success) {
        setAiExplanations(prev => ({
          ...prev,
          [qId]: res.data.explanation
        }));
      }
    } catch (err) {
      console.error('Error fetching AI explanation:', err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleInitiateFollowUp = async (qId: string) => {
    if (followUpChatHistory[qId] && followUpChatHistory[qId].length > 0) return; // already initiated
    setSendingMessage(true);
    try {
      const res = await api.post(`/prep/questions/${qId}/ai-interview`, {
        chatHistory: []
      });
      if (res.data.success) {
        setFollowUpChatHistory(prev => ({
          ...prev,
          [qId]: [{ role: 'model', parts: res.data.response }]
        }));
      }
    } catch (err) {
      console.error('Error starting follow up:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendFollowUpMessage = async (qId: string) => {
    if (!userMessage.trim()) return;
    const msg = userMessage.trim();
    const currentHistory = followUpChatHistory[qId] || [];
    const nextHistory = [
      ...currentHistory,
      { role: 'user', parts: msg }
    ];
    setFollowUpChatHistory(prev => ({
      ...prev,
      [qId]: nextHistory
    }));
    setUserMessage('');
    setSendingMessage(true);

    try {
      const res = await api.post(`/prep/questions/${qId}/ai-interview`, {
        chatHistory: nextHistory
      });
      if (res.data.success) {
        setFollowUpChatHistory(prev => ({
          ...prev,
          [qId]: [...nextHistory, { role: 'model', parts: res.data.response }]
        }));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper to build realistic tag chips depending on topic text
  const getTopicChips = (topic: string) => {
    const tLower = topic.toLowerCase();
    const chips: string[] = [];
    if (tLower.includes('string') || tLower.includes('anagram') || tLower.includes('palindrome')) {
      chips.push('Strings', 'HashMap');
    } else if (tLower.includes('array') || tLower.includes('matrix') || tLower.includes('duplicates') || tLower.includes('sum')) {
      chips.push('Arrays', 'Sorting');
    } else if (tLower.includes('search') || tLower.includes('binary')) {
      chips.push('Searching', 'Binary Search');
    } else if (tLower.includes('sort') || tLower.includes('bubble')) {
      chips.push('Sorting');
    } else if (tLower.includes('prime') || tLower.includes('gcd') || tLower.includes('lcm') || tLower.includes('factorial') || tLower.includes('fibonacci') || tLower.includes('decimal')) {
      chips.push('Math', 'Recursion');
    } else {
      chips.push('Basic Algorithms');
    }
    return chips;
  };

  // Helper to get LeetCode-style acceptance rates and frequencies
  const getLeetcodeMeta = (qId: string, company: string) => {
    // Generate deterministic acceptance based on ID string
    const hex = qId.slice(-4);
    const num = parseInt(hex, 16) || 500;
    const acceptance = 40 + (num % 48); // 40% to 88%
    const solveCount = 1000 + (num % 8999); // 1,000 to 9,999
    
    // Frequency star count based on company name
    let stars = '★★★☆☆';
    if (company === 'TCS' || company === 'Infosys') stars = '★★★★★';
    else if (company === 'Wipro' || company === 'Accenture' || company === 'Cognizant') stars = '★★★★☆';
    
    return { acceptance, solveCount, stars };
  };

  const getRelatedProblems = (topic: string, currentId: string) => {
    const list = [
      { id: '1', title: 'Two Sum Challenge' },
      { id: '2', title: 'Maximum Subarray (Kadane\'s)' },
      { id: '3', title: 'Reverse Word Arrays' },
      { id: '4', title: 'Power of Two Verification' }
    ];
    return list.slice(0, 3);
  };

  const companiesList = [
    'All',
    'General Coding',
    'TCS',
    'Wipro',
    'Infosys',
    'Cognizant',
    'Accenture',
    'Capgemini',
    'HCL',
    'Tech Mahindra'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ==================================================== */}
      {/* 1. TOP HEADER & DASHBOARD STATS */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Question Bank</h1>
          <p className="text-sm text-muted-foreground">
            Explore 100% free company prep resources. Learn step-by-step optimal approaches and test solutions in the Coding Playground.
          </p>
        </div>
        
        {/* Streak and XP metrics */}
        <div className="md:col-span-5 bg-card/35 border border-border p-4 rounded-2xl flex items-center justify-around text-center">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Solved Problems</span>
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-xl font-black text-foreground">{overallStats.solvedCount}</span>
              <span className="text-xs text-muted-foreground">/ {overallStats.allCodingCount || 500}</span>
            </div>
            <div className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase">
              {Math.round(((overallStats.solvedCount || 0) / (overallStats.allCodingCount || 500)) * 100)}% Progress
            </div>
          </div>
          <div className="h-8 border-r border-border" />
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Current Streak</span>
            <div className="flex items-center justify-center space-x-1.5 text-xl font-black text-amber-500">
              <Flame className="w-5 h-5 animate-pulse text-amber-500 fill-amber-500" />
              <span>{user?.streak || 0} Days</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-bold block">Keep coding daily!</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. PROMO GATES: DAILY CHALLENGE & CONTINUE LEARNING */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily featured question block */}
        {dailyQuestion && (
          <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-3xl space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="space-y-2 relative z-10">
              <div className="flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-emerald-500 animate-bounce" />
                <span className="text-[10.5px] font-black text-emerald-500 uppercase tracking-widest">
                  🔥 Question of the Day
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground">{dailyQuestion.topic}</h3>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-black uppercase">
                  {dailyQuestion.difficulty}
                </span>
                <span className="text-muted-foreground font-bold">
                  {dailyQuestion.companyTags?.[0] || 'General'} Pack
                </span>
              </div>
            </div>
            <Link 
              href={`/dashboard/coding?problemId=${dailyQuestion._id}`}
              className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition inline-flex items-center justify-center space-x-1.5 w-fit relative z-10"
            >
              <Terminal className="w-4.5 h-4.5" />
              <span>Solve Now (+20 XP)</span>
            </Link>
          </div>
        )}

        {/* Continue Learning resume block */}
        {lastViewed ? (
          <div className="p-5 border border-primary/20 bg-primary/5 rounded-3xl space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="space-y-2 relative z-10">
              <div className="flex items-center space-x-1.5">
                <BookMarked className="w-4 h-4 text-primary" />
                <span className="text-[10.5px] font-black text-primary uppercase tracking-widest">
                  Continue Learning
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground">{lastViewed.question.topic}</h3>
              <p className="text-[10px] text-muted-foreground font-bold">
                Last viewed in <span className="text-foreground">{lastViewed.company} Prep</span>
              </p>
            </div>
            <Link 
              href={`/dashboard/coding?problemId=${lastViewed.question._id}`}
              className="mt-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2 px-4 rounded-xl text-xs transition inline-flex items-center justify-center space-x-1.5 w-fit relative z-10"
            >
              <span>Resume Problem</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="p-5 border border-dashed border-border bg-card/10 rounded-3xl flex flex-col items-center justify-center text-center text-muted-foreground text-xs p-6 space-y-1">
            <QuestionIcon className="w-8 h-8 opacity-40 text-muted-foreground mb-1" />
            <span className="font-bold">Ready to Practice?</span>
            <span>Click any question below to inspect solutions and track your resume history.</span>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 3. COMPANY SELECTOR TAB BAR */}
      {/* ==================================================== */}
      <div className="space-y-2">
        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
          Select Company Path
        </label>
        <div className="flex overflow-x-auto pb-3 gap-2 border-b border-border scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent scroll-smooth">
          {companiesList.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCompany(c)}
              className={`px-4.5 py-2.5 text-xs font-black rounded-xl whitespace-nowrap transition ${
                selectedCompany === c
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {c === 'All' ? '📂 All Companies' : `📂 ${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. COMPANY STATS BANNER */}
      {/* ==================================================== */}
      {selectedCompany !== 'All' && (
        <div className="p-4 border border-border bg-card/25 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-black text-foreground">{selectedCompany} Curriculum Pack</span>
            <p className="text-[11px] text-muted-foreground">Detailed stats of seeded algorithmic preparation sets.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-[10.5px] font-black">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg">100 Questions</span>
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg">Easy: 40</span>
            <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg">Medium: 40</span>
            <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-lg">Hard: 20</span>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. ADVANCED FILTER BAR */}
      {/* ==================================================== */}
      <div className="p-4 border border-border bg-card/30 rounded-2xl grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs">
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-3 py-2 border border-border bg-background rounded-xl outline-none focus:ring-1 focus:ring-primary text-foreground text-xs"
          />
        </div>

        {/* Category */}
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-background border border-border p-2 rounded-xl outline-none font-bold text-muted-foreground focus:ring-1 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={selectedDiff}
          onChange={(e) => setSelectedDiff(e.target.value)}
          className="bg-background border border-border p-2 rounded-xl outline-none font-bold text-muted-foreground focus:ring-1 focus:ring-primary"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        {/* Format */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-background border border-border p-2 rounded-xl outline-none font-bold text-muted-foreground focus:ring-1 focus:ring-primary"
        >
          <option value="">All Formats</option>
          <option value="MCQ">MCQ</option>
          <option value="Coding">Coding</option>
        </select>

        {/* Solved Status */}
        <select
          value={solvedStatus}
          onChange={(e) => setSolvedStatus(e.target.value)}
          className="bg-background border border-border p-2 rounded-xl outline-none font-bold text-muted-foreground focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Statuses</option>
          <option value="Solved">Solved</option>
          <option value="Unsolved">Unsolved</option>
          <option value="Bookmarked">Saved Only</option>
        </select>
      </div>

      {/* ==================================================== */}
      {/* 6. LEETCODE-STYLE QUESTIONS CARDS LIST */}
      {/* ==================================================== */}
      {loading ? (
        <div className="py-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span>Searching question database...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="border border-dashed border-border p-16 rounded-3xl text-center text-xs text-muted-foreground space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto opacity-45 text-muted-foreground" />
          <span className="font-bold block">No Questions Found</span>
          <span>No questions match your current search constraints or filters. Try reset filters.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const companyTagForMeta = selectedCompany !== 'All' ? selectedCompany : (q.companyTags?.[0] || 'General');
            const meta = getLeetcodeMeta(q._id, companyTagForMeta);
            const isTabActive = openSolutionId === q._id;
            const currentTab = activeTabMap[q._id] || 'solution';

            return (
              <div 
                key={q._id} 
                className={`p-6 border rounded-3xl space-y-4 transition ${
                  isTabActive 
                    ? 'border-primary/45 bg-card/35 shadow-lg' 
                    : 'border-border bg-card/15 hover:bg-card/30'
                }`}
              >
                {/* Card Top Block */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-black uppercase text-[8px] tracking-wider ${
                        q.difficulty === 'Easy' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : q.difficulty === 'Medium' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[9.5px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {q.topic}
                      </span>
                      
                      {/* Topic Tags */}
                      {getTopicChips(q.topic).map(tag => (
                        <span key={tag} className="text-[9px] bg-muted/65 text-muted-foreground px-2 py-0.5 rounded font-semibold">
                          {tag}
                        </span>
                      ))}

                      {/* Solved Status Indicator Badge */}
                      {q.isSolved && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-lg font-black uppercase inline-flex items-center space-x-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Solved</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-foreground leading-relaxed pt-1 flex items-baseline">
                      <span className="text-muted-foreground mr-1.5">Q{idx + 1}.</span> 
                      <span>{q.topic}</span>
                    </h4>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleToggleBookmark(q._id)}
                    className={`p-2 border rounded-xl hover:bg-card transition ${
                      q.isBookmarked 
                        ? 'border-primary text-primary bg-primary/5' 
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {q.isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>

                {/* Acceptance and Frequency details */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10.5px] text-muted-foreground font-semibold">
                  <div className="flex items-center space-x-1">
                    <span>Acceptance Rate:</span>
                    <span className="text-foreground font-bold">{meta.acceptance}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Solved by:</span>
                    <span className="text-foreground font-bold">{meta.solveCount.toLocaleString()} candidates</span>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-500">
                    <span>Frequency:</span>
                    <span className="font-black text-xs leading-none">{meta.stars}</span>
                    <span className="text-[9.5px] bg-amber-500/10 px-1 py-0.5 rounded uppercase font-black tracking-wider ml-1">
                      {companyTagForMeta}
                    </span>
                  </div>
                  <div>
                    <span>Est. Time: <strong className="text-foreground font-bold">10 min</strong></span>
                  </div>
                </div>

                {/* MCQs options (if present) */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctOption;
                      const isOpen = isTabActive && currentTab === 'solution';
                      return (
                        <div 
                          key={oIdx} 
                          className={`p-3 border rounded-xl font-medium ${
                            isOpen && isCorrect 
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                              : 'border-border bg-card/25 text-muted-foreground'
                          }`}
                        >
                          {opt} {isOpen && isCorrect && <span className="font-bold text-[10px] ml-1">(Correct Answer)</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Card Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                  <div className="flex flex-wrap gap-1">
                    {q.companyTags?.slice(0, 3).map((tag, tagIdx) => (
                      <span key={tagIdx} className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[9.5px] font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={() => toggleSolutionTab(q._id, 'solution')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                        isTabActive && currentTab === 'solution'
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:bg-card hover:text-foreground text-muted-foreground'
                      }`}
                    >
                      View Solution
                    </button>

                    <button
                      onClick={() => toggleSolutionTab(q._id, 'ai-explain')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center space-x-1 ${
                        isTabActive && currentTab === 'ai-explain'
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:bg-card text-emerald-500 hover:text-emerald-600 bg-emerald-500/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Explanation</span>
                    </button>

                    <button
                      onClick={() => toggleSolutionTab(q._id, 'ai-interview')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center space-x-1 ${
                        isTabActive && currentTab === 'ai-interview'
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:bg-card text-indigo-500 hover:text-indigo-600 bg-indigo-500/5'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask your doubts</span>
                    </button>

                    {q.type === 'Coding' && (
                      <Link
                        href={`/dashboard/coding?problemId=${q._id}`}
                        className="bg-primary hover:bg-primary/95 text-primary-foreground font-black px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Solve in Playground</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* ==================================================== */}
                {/* EXPANDED SOLUTION ACCORDION DRAWERS */}
                {/* ==================================================== */}
                {isTabActive && (
                  <div className="mt-4 p-5 bg-background border border-border rounded-2xl text-xs space-y-4">
                    {/* Problem Description Context rendered ONCE at the top */}
                    <div className="p-4 bg-card/45 border border-border/80 rounded-2xl space-y-2 leading-relaxed">
                      <span className="font-extrabold text-foreground text-xs block border-b border-border/40 pb-1.5">Problem Description:</span>
                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-xs">{q.questionText}</p>
                    </div>

                    {/* Tab Navigation header */}
                    <div className="flex items-center space-x-4 border-b border-border/60 pb-2 text-[11px] font-bold text-muted-foreground">
                      <button 
                        onClick={() => setActiveTabMap(prev => ({ ...prev, [q._id]: 'solution' }))}
                        className={`pb-1 transition ${currentTab === 'solution' ? 'text-primary border-b-2 border-primary' : 'hover:text-foreground'}`}
                      >
                        Standard Solution
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTabMap(prev => ({ ...prev, [q._id]: 'ai-explain' }));
                          fetchAIExplanation(q._id);
                        }}
                        className={`pb-1 transition flex items-center space-x-1 ${currentTab === 'ai-explain' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'hover:text-foreground'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Explanation</span>
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTabMap(prev => ({ ...prev, [q._id]: 'ai-interview' }));
                          handleInitiateFollowUp(q._id);
                        }}
                        className={`pb-1 transition flex items-center space-x-1 ${currentTab === 'ai-interview' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'hover:text-foreground'}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask your doubts</span>
                      </button>
                      <button 
                        onClick={() => setActiveTabMap(prev => ({ ...prev, [q._id]: 'related' }))}
                        className={`pb-1 transition ${currentTab === 'related' ? 'text-foreground border-b-2 border-foreground' : 'hover:text-foreground'}`}
                      >
                        Related Questions
                      </button>
                    </div>

                    {/* Tab 1: Standard Solution */}
                    {currentTab === 'solution' && (() => {
                      const solutionCode = getInteractiveSolutionCode(q.topic, q.questionText);
                      const currentCode = activeSolutionLang === 'cpp' 
                        ? solutionCode.cpp 
                        : activeSolutionLang === 'python' 
                        ? solutionCode.python 
                        : solutionCode.java;

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <span className="font-black text-primary flex items-center space-x-1">
                              <Info className="w-4 h-4" />
                              <span>Standard Solution Logic:</span>
                            </span>
                            
                            <div className="flex bg-muted/60 p-0.5 rounded-lg text-[10px] font-bold">
                              {(['cpp', 'python', 'java'] as const).map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() => setActiveSolutionLang(lang)}
                                  className={`px-3 py-1.5 rounded-md transition ${
                                    activeSolutionLang === lang
                                      ? 'bg-background text-foreground shadow'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {lang === 'cpp' ? 'C++' : lang === 'python' ? 'Python' : 'Java'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <p className="text-muted-foreground leading-relaxed pl-0.5">
                            {solutionCode.explanation}
                          </p>

                          <div className="relative">
                            <pre className="p-4 bg-zinc-950 text-emerald-400 font-mono text-[11.5px] rounded-xl overflow-x-auto whitespace-pre leading-relaxed border border-border/80">
                              <code>{currentCode}</code>
                            </pre>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Tab 2: AI Explanation (Step-by-step logic, Brute, Optimal, Complexities) */}
                    {currentTab === 'ai-explain' && (
                      <div className="space-y-4">
                        {loadingExplanation ? (
                          <div className="py-6 text-center text-muted-foreground flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            <span>Consulting Gemini Architect...</span>
                          </div>
                        ) : aiExplanations[q._id] ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left logic panel */}
                            <div className="space-y-3">
                              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                                <span className="font-bold text-foreground block">Brute Force Approach</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {aiExplanations[q._id].bruteForce}
                                </p>
                              </div>
                              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                                <span className="font-bold text-foreground block">Step-by-Step Logic Breakdown</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {aiExplanations[q._id].stepByStep}
                                </p>
                              </div>
                              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                                <span className="font-bold text-emerald-500 block">Optimized Approach</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {aiExplanations[q._id].optimalApproach}
                                </p>
                              </div>
                            </div>
                            {/* Right metadata / complex panel */}
                            <div className="space-y-3">
                              <div className="p-3.5 bg-card border border-border rounded-xl grid grid-cols-2 gap-2 text-center">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-muted-foreground block">Time Complexity</span>
                                  <strong className="text-xs text-foreground font-extrabold">{aiExplanations[q._id].timeComplexity}</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-muted-foreground block">Space Complexity</span>
                                  <strong className="text-xs text-foreground font-extrabold">{aiExplanations[q._id].spaceComplexity}</strong>
                                </div>
                              </div>
                              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                                <span className="font-bold text-amber-500 block">Testing Edge Cases</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {aiExplanations[q._id].edgeCases}
                                </p>
                              </div>
                              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                                <span className="font-bold text-indigo-500 block">Company Interviewer Tips</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {aiExplanations[q._id].interviewTips}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-2">Explanation unavailable.</div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Ask your doubts */}
                    {currentTab === 'ai-interview' && (
                      <div className="space-y-3">
                        <div className="text-[11px] font-bold text-muted-foreground flex items-center space-x-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Ask your doubts Tutor:</span>
                        </div>

                        {/* Dialogue panel */}
                        <div className="p-4 bg-zinc-950 border border-border/80 rounded-xl space-y-3 max-h-48 overflow-y-auto leading-relaxed flex flex-col">
                          {(followUpChatHistory[q._id] || []).map((chat, cIdx) => (
                            <div 
                              key={cIdx} 
                              className={`p-2.5 rounded-xl max-w-[85%] text-[11px] leading-relaxed ${
                                chat.role === 'model' 
                                  ? 'bg-muted/40 text-muted-foreground self-start' 
                                  : 'bg-primary text-primary-foreground font-medium self-end'
                              }`}
                            >
                              <strong className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80">
                                {chat.role === 'model' ? '🤖 AI Coding Tutor' : '👤 You'}
                              </strong>
                              <span className="whitespace-pre-wrap">{chat.parts}</span>
                            </div>
                          ))}

                          {sendingMessage && (
                            <div className="bg-muted/30 text-muted-foreground p-2 rounded-xl self-start text-[10px] animate-pulse flex items-center">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce mr-1" />
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce mr-1 [animation-delay:0.2s]" />
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input Row */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendFollowUpMessage(q._id);
                            }}
                            placeholder="Ask a doubt about this problem (e.g. 'how to solve in python', 'explain loop logic')..."
                            className="flex-1 bg-zinc-900 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500"
                            disabled={sendingMessage}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendFollowUpMessage(q._id)}
                            disabled={sendingMessage || !userMessage.trim()}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold p-2 px-4.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Related Problems links */}
                    {currentTab === 'related' && (
                      <div className="space-y-2">
                        <span className="font-black text-foreground">Similar Coding Problems to practice:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {getRelatedProblems(q.topic, q._id).map((rp, rpIdx) => (
                            <div 
                              key={rpIdx}
                              className="p-3 border border-border bg-card/20 rounded-xl hover:bg-card/40 transition flex items-center justify-between"
                            >
                              <span className="font-semibold text-[11px] text-foreground">{rp.title}</span>
                              <QuestionIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
