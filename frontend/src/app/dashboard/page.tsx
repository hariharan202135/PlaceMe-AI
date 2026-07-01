'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  Trophy, Flame, Clock, Sparkles, BookOpen, UserCheck, 
  Terminal, ShieldCheck, FileSpreadsheet, ArrowRight, Award, AlertCircle 
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [recentResumes, setRecentResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        const [testsRes, interviewsRes, resumesRes] = await Promise.all([
          api.get('/mock-tests/history').catch(() => ({ data: { history: [] } })),
          api.get('/interviews/history').catch(() => ({ data: { history: [] } })),
          api.get('/resume/history').catch(() => ({ data: { history: [] } }))
        ]);

        setRecentTests(testsRes.data.history?.slice(0, 3) || []);
        setRecentInterviews(interviewsRes.data.history?.slice(0, 3) || []);
        setRecentResumes(resumesRes.data.history?.slice(0, 3) || []);
      } catch (error) {
        console.error('Error fetching dashboard activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, []);

  if (!user) return null;

  // Radar Chart data
  const skillsData = [
    { subject: 'Aptitude', value: user.aptitudeScore || 20, fullMark: 100 },
    { subject: 'Coding', value: user.codingScore || 20, fullMark: 100 },
    { subject: 'HR Interview', value: user.hrScore || 20, fullMark: 100 },
    { subject: 'Resume ATS', value: user.resumeScore || 20, fullMark: 100 },
  ];

  // Combined activity list
  const activities = [
    ...recentTests.map(t => ({
      type: 'Mock Test',
      title: t.mockTest?.title || 'Placement Mock Test',
      score: `${t.totalScore}%`,
      status: t.status,
      date: new Date(t.createdAt).toLocaleDateString(),
      rawDate: new Date(t.createdAt)
    })),
    ...recentInterviews.map(i => ({
      type: 'AI HR Interview',
      title: `Interview for ${i.jobRole}`,
      score: `${i.overallScore}/100`,
      status: i.overallScore >= 70 ? 'Pass' : 'Fail',
      date: new Date(i.createdAt).toLocaleDateString(),
      rawDate: new Date(i.createdAt)
    })),
    ...recentResumes.map(r => ({
      type: 'Resume ATS Scan',
      title: r.fileName,
      score: `${r.atsScore}%`,
      status: r.atsScore >= 70 ? 'Pass' : 'Fail',
      date: new Date(r.createdAt).toLocaleDateString(),
      rawDate: new Date(r.createdAt)
    }))
  ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. TOP GREETING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Placement Preparation active</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-primary">{user.name}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Here is your real-time placement readiness checklist and progress dashboard.
          </p>
        </div>

        {/* Streaks Card */}
        <div className="flex items-center space-x-4 bg-card border border-border p-4 rounded-2xl shadow-sm w-fit">
          <div className="bg-amber-500/15 text-amber-500 p-2.5 rounded-xl">
            <Flame className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Current Streak</span>
            <span className="text-xl font-bold">{user.streak || 1} Day{user.streak === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* 2. STATS SUMMARY TILES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Readiness Index */}
        <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-primary bg-primary/10 p-2 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider block">Readiness Score</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold">{user.placementReadinessScore || 0}%</span>
            <span className="text-[10px] font-bold text-emerald-500">Live</span>
          </div>
          <div className="w-full bg-border h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${user.placementReadinessScore || 10}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">Aggregated across all testing modules.</p>
        </div>

        {/* Aptitude Score */}
        <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-indigo-400 bg-indigo-500/10 p-2 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider block">Aptitude Score</span>
          <span className="text-3xl font-extrabold block">{user.aptitudeScore || 0}%</span>
          <div className="w-full bg-border h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${user.aptitudeScore || 10}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">Quantitative, Logical, Verbal averages.</p>
        </div>

        {/* Coding Score */}
        <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-emerald-400 bg-emerald-500/10 p-2 rounded-lg">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider block">Coding Score</span>
          <span className="text-3xl font-extrabold block">{user.codingScore || 0}%</span>
          <div className="w-full bg-border h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${user.codingScore || 10}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">Algorithms and data structure challenges.</p>
        </div>

        {/* HR Interview Score */}
        <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-purple-400 bg-purple-500/10 p-2 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider block">AI HR Score</span>
          <span className="text-3xl font-extrabold block">{user.hrScore || 0}%</span>
          <div className="w-full bg-border h-2 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${user.hrScore || 10}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">Grammar, technical logic, and confidence ratings.</p>
        </div>
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Skills Balance */}
        <div className="lg:col-span-1 p-6 border border-border bg-card/30 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold">Skills Balance</h3>
          <p className="text-xs text-muted-foreground">Check which modules require immediate attention.</p>
          
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" stroke="var(--muted-foreground)" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--border)" fontSize={9} />
                <Radar 
                  name={user.name} 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  fill="var(--primary)" 
                  fillOpacity={0.25} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Progress Timeline */}
        <div className="lg:col-span-2 p-6 border border-border bg-card/30 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-bold">Recent Activities</h3>
            <p className="text-xs text-muted-foreground">Logs of your latest exam submissions and uploads.</p>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-10 text-muted-foreground text-xs">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" />
              <span>Fetching activity history...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl bg-card/10 space-y-2">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <h5 className="font-semibold text-sm">No activity recorded</h5>
              <p className="text-xs text-muted-foreground max-w-xs">
                You haven't attempted any mock tests, resume scans, or HR interviews yet.
              </p>
              <Link 
                href="/dashboard/mock-tests" 
                className="text-xs text-primary font-bold hover:underline flex items-center space-x-1 pt-2"
              >
                <span>Take a mock test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                    <th className="pb-3">Module</th>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {activities.map((act, idx) => (
                    <tr key={idx} className="hover:bg-card/10">
                      <td className="py-3.5 font-medium text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                          act.type === 'Mock Test' 
                            ? 'bg-blue-500/10 text-blue-500' 
                            : act.type === 'AI HR Interview' 
                            ? 'bg-purple-500/10 text-purple-500' 
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {act.type}
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-xs truncate max-w-[180px]">{act.title}</td>
                      <td className="py-3.5 font-bold text-xs">{act.score}</td>
                      <td className="py-3.5 text-xs">
                        <span className={`font-bold ${act.status === 'Pass' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-xs text-muted-foreground">{act.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. COMPANY ACTION CARDS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">Structured Company Preparation</h3>
          <p className="text-xs text-muted-foreground">Select a target company to load specific cognitive and coding study packages.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { name: 'TCS NQT Prep', tag: 'TCS', color: 'border-blue-500/30 bg-blue-500/5' },
            { name: 'Infosys SP/DSE Prep', tag: 'Infosys', color: 'border-indigo-500/30 bg-indigo-500/5' },
            { name: 'Wipro NLTH Prep', tag: 'Wipro', color: 'border-cyan-500/30 bg-cyan-500/5' },
            { name: 'Accenture Cognitive', tag: 'Accenture', color: 'border-emerald-500/30 bg-emerald-500/5' }
          ].map((item, idx) => (
            <Link 
              key={idx}
              href={`/dashboard/mock-tests?company=${item.tag}`}
              className={`p-6 border rounded-2xl flex flex-col justify-between group cursor-pointer hover:-translate-y-0.5 transition ${item.color}`}
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{item.tag}</span>
                <h4 className="font-bold text-sm group-hover:text-primary transition">{item.name}</h4>
                <p className="text-[11px] text-muted-foreground">Includes quantitative MCQs, pseudocode tests, and specialized coding tests.</p>
              </div>
              <div className="flex items-center space-x-1 text-xs font-semibold text-primary pt-4 group-hover:underline">
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
