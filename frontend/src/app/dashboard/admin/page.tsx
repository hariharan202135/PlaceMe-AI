'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  ShieldAlert, Users, CreditCard, ClipboardList, PlusCircle, 
  Trash2, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle, 
  HelpCircle, Trash, Ban, Check, Sparkles, FileText
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Client role check gate
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Tab state: 'stats' | 'users' | 'payments' | 'questions'
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'payments' | 'questions'>('stats');

  // Stats data
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users data
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  // Payments data
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Question Creator Form states
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [formMsg, setFormMsg] = useState({ success: '', error: '' });
  const [qType, setQType] = useState<'MCQ' | 'Coding'>('MCQ');
  const [qCatSlug, setQCatSlug] = useState('aptitude');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [qText, setQText] = useState('');
  
  // MCQ specific
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState<number>(0);

  // Coding specific test cases (at least 2)
  const [tc1Input, setTc1Input] = useState('');
  const [tc1Output, setTc1Output] = useState('');
  const [tc1Hidden, setTc1Hidden] = useState(false);
  const [tc2Input, setTc2Input] = useState('');
  const [tc2Output, setTc2Output] = useState('');
  const [tc2Hidden, setTc2Hidden] = useState(true);

  useEffect(() => {
    if (activeTab === 'stats') fetchAdminStats();
    if (activeTab === 'users') fetchAdminUsers();
    if (activeTab === 'payments') fetchAdminPayments();
  }, [activeTab]);

  // Trigger search on users
  useEffect(() => {
    if (activeTab === 'users') {
      fetchAdminUsers();
    }
  }, [searchUser]);

  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAdminUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = searchUser ? { search: searchUser } : {};
      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAdminPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.get('/admin/payments');
      if (res.data.success) {
        setPaymentsList(res.data.payments);
      }
    } catch (err) {
      console.error('Error fetching payments list:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleUpdateUserPlan = async (userId: string, plan: 'Free' | 'Monthly' | 'Yearly') => {
    try {
      const res = await api.put(`/admin/users/${userId}`, {
        plan,
        status: plan === 'Free' ? 'inactive' : 'active'
      });
      if (res.data.success) {
        setUsersList(prev => prev.map(u => u._id === userId ? res.data.user : u));
      }
    } catch (err) {
      console.error('Error updating user subscription:', err);
      alert('Error updating user plan.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        setUsersList(prev => prev.filter(u => u._id !== userId));
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    setQOptions(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg({ success: '', error: '' });

    if (!qTopic || !qText) {
      setFormMsg(prev => ({ ...prev, error: 'Topic and Question text are required.' }));
      return;
    }

    setIsSubmittingQuestion(true);

    const payload: any = {
      categorySlug: qCatSlug,
      topic: qTopic,
      difficulty: qDifficulty,
      type: qType,
      questionText: qText
    };

    if (qType === 'MCQ') {
      payload.options = qOptions.filter(o => o.trim() !== '');
      payload.correctOption = qCorrect;
      payload.explanation = 'Solved correctly by matching logical specifications.';
    } else {
      const testCases = [];
      if (tc1Input && tc1Output) {
        testCases.push({ input: tc1Input + '\n', output: tc1Output, isHidden: tc1Hidden });
      }
      if (tc2Input && tc2Output) {
        testCases.push({ input: tc2Input + '\n', output: tc2Output, isHidden: tc2Hidden });
      }
      if (testCases.length === 0) {
        setFormMsg(prev => ({ ...prev, error: 'At least one coding test case is required.' }));
        setIsSubmittingQuestion(false);
        return;
      }
      payload.codingTestCases = testCases;
      payload.explanation = 'Solve using standard dynamic iterations or loops.';
    }

    try {
      const res = await api.post('/admin/questions', payload);
      if (res.data.success) {
        setFormMsg({ success: 'Question successfully created and seeded into prep banks!', error: '' });
        // Reset form
        setQTopic('');
        setQText('');
        setQOptions(['', '', '', '']);
        setTc1Input('');
        setTc1Output('');
        setTc2Input('');
        setTc2Output('');
      }
    } catch (err: any) {
      setFormMsg({ success: '', error: err.response?.data?.message || 'Error occurred during creation.' });
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Panel</h1>
        <p className="text-sm text-muted-foreground">
          System dashboard, active billing logs, user profiles manager, and custom question seeder.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border text-xs font-semibold space-x-6">
        {[
          { id: 'stats', label: 'System Overview', icon: Users },
          { id: 'users', label: 'User Profiles Manager', icon: Users },
          { id: 'payments', label: 'Billing Logs', icon: CreditCard },
          { id: 'questions', label: 'Question Seeder', icon: PlusCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 border-b-2 font-bold flex items-center space-x-1.5 transition outline-none ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* 1. OVERVIEW STATS TAB */}
      {/* ==================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              <span>Fetching stats...</span>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Count cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                <div className="p-5 border border-border bg-card/30 rounded-2xl space-y-2">
                  <span className="text-muted-foreground font-semibold block uppercase">Total Accounts</span>
                  <span className="text-2xl font-black text-foreground">{stats.totalUsers}</span>
                </div>
                <div className="p-5 border border-border bg-card/30 rounded-2xl space-y-2">
                  <span className="text-muted-foreground font-semibold block uppercase">Premium Plans</span>
                  <span className="text-2xl font-black text-primary">{stats.premiumUsers}</span>
                </div>
                <span className="hidden md:block"></span>
                <div className="p-5 border border-border bg-card/30 rounded-2xl space-y-2">
                  <span className="text-muted-foreground font-semibold block uppercase">Revenue (INR)</span>
                  <span className="text-2xl font-black text-emerald-500">₹{stats.totalRevenue}</span>
                </div>
              </div>

              {/* Recent Audit logs and transactions list */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
                {/* Recent Billing */}
                <div className="p-6 border border-border bg-card/20 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold">Recent Billing Transactions</h3>
                  <div className="space-y-3.5">
                    {stats.recentPayments?.map((p: any) => (
                      <div key={p._id} className="flex justify-between items-center p-3 border border-border bg-background rounded-xl">
                        <div>
                          <span className="font-bold text-foreground block">{p.user?.name || 'Deleted Account'}</span>
                          <span className="text-[10px] text-muted-foreground">{p.user?.email || ''}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-500 block">₹{p.amount}</span>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit trail */}
                <div className="p-6 border border-border bg-card/20 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold">Administrative Audit Logs</h3>
                  <div className="space-y-3">
                    {stats.recentLogs?.map((l: any) => (
                      <div key={l._id} className="p-3 border border-border bg-background rounded-xl space-y-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-primary">{l.action}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{l.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>Failed to load stats.</div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. USER MANAGER TAB */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-sm text-xs">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="border border-border bg-card/30 rounded-2xl overflow-hidden text-xs">
            {loadingUsers ? (
              <div className="py-12 text-center text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mr-2" />
                <span>Loading users database...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-card/55 text-muted-foreground font-semibold">
                      <th className="p-4">Name / Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Subscription plan</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {usersList.map((usr) => (
                      <tr key={usr._id} className="hover:bg-card/10">
                        <td className="p-4">
                          <span className="font-bold text-foreground block">{usr.name}</span>
                          <span className="text-[10px] text-muted-foreground">{usr.email}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                            usr.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-foreground">{usr.subscription?.plan || 'Free'}</span>
                            <span className={`text-[9px] px-1 rounded font-bold uppercase ${
                              usr.subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                            }`}>
                              {usr.subscription?.status === 'active' ? 'Active' : 'Expired'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          {usr.subscription?.status !== 'active' ? (
                            <button
                              onClick={() => handleUpdateUserPlan(usr._id, 'Monthly')}
                              className="px-3 py-1 border border-primary text-primary hover:bg-primary/10 rounded font-semibold text-[10px]"
                            >
                              Grant Premium
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserPlan(usr._id, 'Free')}
                              className="px-3 py-1 border border-border text-muted-foreground hover:bg-card rounded font-semibold text-[10px]"
                            >
                              Revoke Plan
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(usr._id)}
                            className="p-1 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ==================================================== */}
      {/* 3. BILLING LOGS TAB */}
      {/* ==================================================== */}
      {activeTab === 'payments' && (
        <div className="border border-border bg-card/30 rounded-2xl overflow-hidden text-xs">
          {loadingPayments ? (
            <div className="py-12 text-center text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mr-2" />
              <span>Fetching logs...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/55 text-muted-foreground font-semibold">
                    <th className="p-4">Transaction User</th>
                    <th className="p-4">Receipt Order ID</th>
                    <th className="p-4">Payment ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paymentsList.map((pay) => (
                    <tr key={pay._id} className="hover:bg-card/10">
                      <td className="p-4">
                        <span className="font-bold text-foreground block">{pay.user?.name || 'Deleted account'}</span>
                        <span className="text-[10px] text-muted-foreground">{pay.user?.email || ''}</span>
                      </td>
                      <td className="p-4 font-mono text-[10px]">{pay.orderId || 'Direct / Subscription'}</td>
                      <td className="p-4 font-mono text-[10px] truncate max-w-[120px]">{pay.paymentId || pay.subscriptionId}</td>
                      <td className="p-4 font-extrabold text-foreground">₹{pay.amount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                          pay.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {new Date(pay.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. QUESTIONS CREATOR FORM TAB */}
      {/* ==================================================== */}
      {activeTab === 'questions' && (
        <form onSubmit={handleCreateQuestionSubmit} className="max-w-2xl border border-border bg-card/35 p-6 rounded-2xl space-y-6 text-xs">
          <h3 className="text-lg font-bold">Add Question to Database</h3>

          {formMsg.success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl p-3 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{formMsg.success}</span>
            </div>
          )}

          {formMsg.error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{formMsg.error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                Question Type
              </label>
              <select
                value={qType}
                onChange={(e) => setQType(e.target.value as any)}
                className="w-full bg-background border border-border p-2 rounded-xl outline-none text-foreground font-bold focus:ring-1 focus:ring-primary"
              >
                <option value="MCQ">Multiple Choice Question (MCQ)</option>
                <option value="Coding">Coding Sandbox Challenge</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                Category Slug Mapping
              </label>
              <select
                value={qCatSlug}
                onChange={(e) => setQCatSlug(e.target.value)}
                className="w-full bg-background border border-border p-2 rounded-xl outline-none text-foreground font-bold focus:ring-1 focus:ring-primary"
              >
                <option value="aptitude">Quantitative Aptitude</option>
                <option value="logical">Logical Reasoning</option>
                <option value="verbal">Verbal Ability</option>
                <option value="coding">Coding & Algorithms</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                Topic Name
              </label>
              <input
                type="text"
                required
                value={qTopic}
                onChange={(e) => setQTopic(e.target.value)}
                placeholder="e.g. Dynamic Programming / Syllogisms"
                className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                Difficulty
              </label>
              <select
                value={qDifficulty}
                onChange={(e) => setQDifficulty(e.target.value as any)}
                className="w-full bg-background border border-border p-2 rounded-xl outline-none text-foreground font-bold focus:ring-1 focus:ring-primary"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
              Question Text (Supports Markdown for Coding Descriptions)
            </label>
            <textarea
              rows={4}
              required
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Type the problem question text here..."
              className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary text-foreground font-sans resize-none"
            />
          </div>

          {/* MCQ Options inputs */}
          {qType === 'MCQ' && (
            <div className="space-y-4 border-t border-border pt-4">
              <h4 className="font-bold text-sm">MCQ Options Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qOptions.map((opt, idx) => (
                  <div key={idx}>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Option {idx + 1}</label>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Choice ${idx + 1}`}
                      className="w-full p-2 bg-background border border-border rounded-xl outline-none text-foreground"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Correct Choice Index (0-indexed)</label>
                <select
                  value={qCorrect}
                  onChange={(e) => setQCorrect(parseInt(e.target.value))}
                  className="bg-background border border-border p-1.5 rounded-lg outline-none font-bold text-primary"
                >
                  <option value={0}>Option 1 (Index 0)</option>
                  <option value={1}>Option 2 (Index 1)</option>
                  <option value={2}>Option 3 (Index 2)</option>
                  <option value={3}>Option 4 (Index 3)</option>
                </select>
              </div>
            </div>
          )}

          {/* Coding Test Cases config */}
          {qType === 'Coding' && (
            <div className="space-y-4 border-t border-border pt-4">
              <h4 className="font-bold text-sm">Test Cases Configuration</h4>
              
              {/* Test Case 1 */}
              <div className="p-4 border border-border bg-background rounded-xl space-y-3">
                <span className="font-bold text-xs text-primary block">Test Case 1 (Public Visible)</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Input Stdin</label>
                    <input
                      type="text"
                      value={tc1Input}
                      onChange={(e) => setTc1Input(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full p-2 bg-card border border-border rounded-lg outline-none text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Expected Output Stdout</label>
                    <input
                      type="text"
                      value={tc1Output}
                      onChange={(e) => setTc1Output(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full p-2 bg-card border border-border rounded-lg outline-none text-foreground font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Test Case 2 */}
              <div className="p-4 border border-border bg-background rounded-xl space-y-3">
                <span className="font-bold text-xs text-primary block">Test Case 2 (Hidden Case)</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Input Stdin</label>
                    <input
                      type="text"
                      value={tc2Input}
                      onChange={(e) => setTc2Input(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full p-2 bg-card border border-border rounded-lg outline-none text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Expected Output Stdout</label>
                    <input
                      type="text"
                      value={tc2Output}
                      onChange={(e) => setTc2Output(e.target.value)}
                      placeholder="e.g. 55"
                      className="w-full p-2 bg-card border border-border rounded-lg outline-none text-foreground font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingQuestion}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
            >
              {isSubmittingQuestion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              <span>Create Question</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
