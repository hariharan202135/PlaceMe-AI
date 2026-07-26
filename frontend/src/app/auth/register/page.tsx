'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User, Mail, Key, ShieldAlert, Sparkles, Sun, Moon, UserPlus, Eye, EyeOff, X, ArrowRight } from 'lucide-react';

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

  // Google Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');

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

  const handleGoogleClick = () => {
    setErrorMsg('');
    setShowGoogleModal(true);
  };

  const handleGoogleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleName) return;

    setIsSubmitting(true);
    const res = await googleLogin({
      name: googleName,
      email: googleEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName)}`
    });
    setIsSubmitting(false);
    setShowGoogleModal(false);
    if (!res.success) {
      setErrorMsg('Google sign up failed. Please try again.');
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

      {/* Google Login Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-left relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Sign up with Google</h3>
                  <p className="text-xs text-muted-foreground">Enter your Google Account details</p>
                </div>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGoogleModalSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Your Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Rahul Sharma"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Google Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="rahul@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

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
            onClick={handleGoogleClick}
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
