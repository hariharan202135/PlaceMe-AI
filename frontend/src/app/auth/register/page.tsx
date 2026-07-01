'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User, Mail, Key, ShieldAlert, Sparkles, Sun, Moon, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register, googleLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    
    setErrorMsg('');
    setIsSubmitting(true);
    
    const res = await register(name, email, password);
    setIsSubmitting(false);
    
    if (!res.success) {
      setErrorMsg(res.message || 'Registration failed.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    const res = await googleLogin({
      name: 'Test Student',
      email: 'student@placeme.ai',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=student'
    });
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg('Google login failed.');
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
            <span>Create Account</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Join <span className="text-primary">PlaceMe AI</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get personalized ATS scores and AI HR interview preps
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-sm flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3.5">
            <div>
              <label htmlFor="full-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="full-name"
                  name="name"
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={`block w-full pl-10 pr-4 py-2 border bg-card/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition text-sm duration-200 ${
                    errorMsg ? 'border-red-500/50' : 'border-border'
                  }`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email-address" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
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
                  placeholder="john@example.com"
                  className={`block w-full pl-10 pr-4 py-2 border bg-card/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition text-sm duration-200 ${
                    errorMsg ? 'border-red-500/50' : 'border-border'
                  }`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
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
                  placeholder="•••••••• (Min 6 chars)"
                  className={`block w-full pl-10 pr-10 py-2 border bg-card/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition text-sm duration-200 ${
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

            <div>
              <label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-2 border bg-card/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition text-sm duration-200 ${
                    errorMsg ? 'border-red-500/50' : 'border-border'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-4">
            By signing up, you agree to our{' '}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{' '}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="inline-flex items-center space-x-1.5">
                  <UserPlus className="w-4.5 h-4.5" />
                  <span>Sign Up</span>
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2.5 py-2.5 border border-border bg-card hover:bg-card/80 rounded-xl text-sm font-medium transition duration-150"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.736 1.514 6.7L5.266 9.765z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.825-.074-1.62-.21-2.385H12v4.51h6.44c-.277 1.464-1.1 2.705-2.34 3.54l3.65 2.83c2.13-1.965 3.34-4.86 3.34-8.495z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235L1.514 17.3c1.86 3.964 5.84 6.7 10.486 6.7 3.055 0 5.627-1.01 7.505-2.745l-3.65-2.83c-1.01.68-2.31 1.085-3.855 1.085-2.91 0-5.373-1.964-6.255-4.635l-3.75 2.92z"
              />
              <path
                fill="#34A853"
                d="M1.514 6.7C.545 8.773 0 11.08 0 13.5c0 2.42.545 4.727 1.514 6.8l3.75-2.92c-.88-2.67-.88-5.71 0-8.38L1.514 6.7z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>
        </div>

        <div className="text-center text-xs mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
