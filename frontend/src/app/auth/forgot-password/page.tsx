'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { Mail, ShieldAlert, Sparkles, Sun, Moon, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setResetLink('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setIsSubmitting(false);
      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Reset link generated successfully.');
        if (response.data.resetLink) {
          setResetLink(response.data.resetLink);
        }
      } else {
        setErrorMsg(response.data.message || 'Failed to request reset link.');
      }
    } catch (error: any) {
      setIsSubmitting(false);
      setErrorMsg(error.response?.data?.message || 'Error requesting password reset.');
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
            <span>Reset credentials</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll generate a verification link.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-sm flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl p-4 text-sm flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">Reset Email Logged</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {successMsg}
            </p>
            {resetLink && (
              <div className="mt-2 p-2.5 bg-card/80 border border-border rounded-lg text-xs break-all flex flex-col space-y-1 text-foreground">
                <span className="font-medium text-primary">Local Verification Link (Click to test):</span>
                <a href={resetLink} className="underline text-indigo-400 hover:text-indigo-300">
                  {resetLink}
                </a>
              </div>
            )}
          </div>
        )}

        {!successMsg && (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-registered@email.com"
                  className="block w-full pl-10 pr-4 py-2.5 border border-border bg-card/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                />
              </div>
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
                    <Send className="w-4 h-4" />
                    <span>Send Reset Link</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs mt-6">
          <Link href="/auth/login" className="inline-flex items-center space-x-1.5 font-semibold text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
