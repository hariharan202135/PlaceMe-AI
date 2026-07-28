'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogIn, Key, Mail, ShieldAlert, Sparkles, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import GoogleLoginButton from '@/components/GoogleLoginButton';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    
    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-glow" />

      {/* Floating Theme Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-full border border-border bg-card/50 hover:bg-card transition duration-200"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
      </button>

      <div className="max-w-md w-full space-y-8 glass p-8 rounded-2xl shadow-xl relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empowered by Gemini & Node</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Welcome back to <span className="text-primary">PlaceMe AI</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your placement readiness checklist
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-sm flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`block w-full pl-10 pr-4 py-2.5 border bg-card/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition text-sm duration-200 ${
                    errorMsg ? 'border-red-500/50' : 'border-border'
                  }`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-2.5 border bg-card/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition text-sm duration-200 ${
                    errorMsg ? 'border-red-500/50' : 'border-border'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 text-muted-foreground">
                Remember me
              </label>
            </div>

            <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="inline-flex items-center space-x-1.5">
                  <LogIn className="w-4.5 h-4.5" />
                  <span>Sign In</span>
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div>
          <GoogleLoginButton
            onError={setErrorMsg}
            onLoadingChange={setIsSubmitting}
            text="signin_with"
          />
        </div>

        <div className="text-center text-xs mt-6 text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
