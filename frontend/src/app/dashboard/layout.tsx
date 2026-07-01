'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  LayoutDashboard, FileText, UserCheck, Code2, ShieldAlert,
  ClipboardList, HelpCircle, Sun, Moon, LogOut, Sparkles,
  BookOpen, CreditCard, ChevronRight, Menu, X, Info
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authenticate / Redirect Gate
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wider animate-pulse text-muted-foreground">
          Verifying Session Access...
        </span>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Placement Mocks', path: '/dashboard/mock-tests', icon: ClipboardList },
    { name: 'AI HR Interview', path: '/dashboard/interviews', icon: UserCheck },
    { name: 'ATS Resume Analyser', path: '/dashboard/resume', icon: FileText },
    { name: 'Coding Playground', path: '/dashboard/coding', icon: Code2 },
    { name: 'Question Bank', path: '/dashboard/questions', icon: BookOpen },
    { name: 'About', path: '/dashboard/about', icon: Info },
    { name: 'Billing & Plans', path: '/dashboard/billing', icon: CreditCard },
  ];

  const adminItem = { name: 'Admin Control', path: '/dashboard/admin', icon: ShieldAlert };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground transition-colors duration-300">
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/45 relative z-25 flex-shrink-0">
        {/* Logo and Brand */}
        <div className="border-b border-border bg-card/10 py-5">
          <Link href="/dashboard" className="flex flex-col items-center justify-center space-y-2.5 group hover:bg-muted/10 transition-all duration-200 py-1.5 rounded-2xl mx-4">
            <div className="relative w-[72px] h-[72px] rounded-full border-2 border-primary/35 bg-transparent flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200 p-1 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/nh-logo.jpg" 
                alt="NH Logo" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="text-center space-y-0.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity block leading-none">
                PlaceMe AI
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-none pt-0.5">
                by N Hari
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-border flex items-center space-x-3">
          <img 
            src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
            alt="Avatar"
            className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex-shrink-0"
          />
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm truncate">{user.name}</h4>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold uppercase block w-fit mt-1">
              {user.subscription?.plan || 'Free'} Plan
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link
                key={idx}
                href={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted hover:text-foreground text-muted-foreground'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-primary-foreground' : ''}`} />
              </Link>
            );
          })}

          {/* Admin link */}
          {user.role === 'admin' && (
            <div className="border-t border-border mt-4 pt-4">
              <Link
                href={adminItem.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
                  pathname.startsWith(adminItem.path)
                    ? 'bg-destructive/90 text-primary-foreground'
                    : 'hover:bg-destructive/10 text-red-500 hover:text-red-600'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <adminItem.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{adminItem.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          )}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted transition text-muted-foreground"
          >
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 flex items-center justify-between px-6 border-b border-border bg-card/45 relative z-20">
          <Link href="/dashboard" className="flex items-center space-x-3 group hover:opacity-90 transition-opacity">
            <div className="relative w-[56px] h-[56px] md:w-[58px] md:h-[58px] rounded-full border-2 border-primary/35 bg-transparent flex-shrink-0 flex items-center justify-center shadow-sm p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/nh-logo.jpg" 
                alt="NH Logo" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-md tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent font-sans leading-none">
                PlaceMe AI
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none mt-1">
                by N Hari
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            
            {/* Sidebar Body */}
            <aside className="relative flex flex-col w-64 bg-card border-r border-border h-full p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center space-x-3 group hover:opacity-90 transition-opacity">
                  <div className="relative w-[56px] h-[56px] md:w-[58px] md:h-[58px] rounded-full border-2 border-primary/35 bg-transparent flex-shrink-0 flex items-center justify-center shadow-sm p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/nh-logo.jpg" 
                      alt="NH Logo" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-extrabold text-md tracking-tight text-foreground font-sans leading-none">PlaceMe AI</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none mt-1">by N Hari</span>
                  </div>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User info */}
              <div className="flex items-center space-x-3 border-b border-border pb-4">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                  alt="Avatar"
                  className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/20 flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <h4 className="font-bold text-xs truncate">{user.name}</h4>
                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold uppercase block w-fit mt-0.5">
                    {user.subscription?.plan || 'Free'}
                  </span>
                </div>
              </div>

              {/* Nav menu */}
              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={idx}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted hover:text-foreground text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {user.role === 'admin' && (
                  <div className="border-t border-border mt-3 pt-3">
                    <Link
                      href={adminItem.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                        pathname.startsWith(adminItem.path)
                          ? 'bg-destructive/95 text-primary-foreground'
                          : 'hover:bg-destructive/10 text-red-500'
                      }`}
                    >
                      <adminItem.icon className="w-4.5 h-4.5" />
                      <span>{adminItem.name}</span>
                    </Link>
                  </div>
                )}
              </nav>

              {/* Sidebar Action bottom */}
              <div className="border-t border-border pt-4 space-y-2">
                <button
                  onClick={() => {
                    toggleTheme();
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-muted transition text-muted-foreground"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                
                <button
                  onClick={() => {
                    logout();
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Content body */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10 scrollbar-thin scrollbar-thumb-muted/30">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
