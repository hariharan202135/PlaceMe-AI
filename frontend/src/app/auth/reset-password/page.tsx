'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { Key, ShieldAlert, Sparkles, Sun, Moon, CheckCircle, LogIn } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!token) {
      setErrorMsg('Reset token is missing.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setIsSubmitting(false);
      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Password updated successfully!');
      } else {
        setErrorMsg(response.data.message || 'Reset failed.');
      }
    } catch (error: any) {
      setIsSubmitting(false);
      setErrorMsg(error.response?.data?.message || 'Error updating password.');
    }
  };

  return (
    <>
      <div className="text-center">
        <div className="inline-flex items-center justify-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Reset Credentials</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Update Password
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Type your new password below to update your login credentials.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-sm flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl p-4 text-sm space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            You can now log in using your new credentials.
          </p>
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition hover:bg-primary/90"
          >
            <LogIn className="w-4 h-4" />
            <span>Proceed to Login</span>
          </Link>
        </div>
      )}

      {!successMsg && token && (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="pass" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Key className="w-4 h-4" />
              </div>
              <input
                id="pass"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-2 border border-border bg-card/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-pass" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Key className="w-4 h-4" />
              </div>
              <input
                id="confirm-pass"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-2 border border-border bg-card/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  const { theme, toggleTheme } = useTheme();

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
        <Suspense fallback={<div className="text-center py-8">Loading verification data...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
