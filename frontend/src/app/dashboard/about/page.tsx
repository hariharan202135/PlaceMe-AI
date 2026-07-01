'use client';

import React from 'react';
import { 
  Sparkles, ShieldCheck, Layers, Award, Info, 
  LayoutDashboard, ClipboardList, UserCheck, FileText, 
  Code2, BookOpen, CreditCard, Heart, Mail, Compass
} from 'lucide-react';

export default function AboutPage() {
  const modules = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      description: 'The central control center of PlaceMe AI. It provides students with a complete overview of their placement preparation journey.',
      features: [
        'Placement Readiness Score',
        'Aptitude Progress',
        'Coding Progress',
        'AI Interview Progress',
        'Resume Analysis Status',
        'Recent Activities',
        'Skill Balance'
      ]
    },
    {
      title: 'Placement Mocks',
      icon: ClipboardList,
      description: 'Practice company-specific placement assessments that simulate real campus recruitment tests.',
      features: [
        'Company-wise Mock Tests',
        'Timed Assessments',
        'Performance Analysis',
        'Previous Attempts',
        'Readiness Tracking'
      ]
    },
    {
      title: 'AI HR Interview',
      icon: UserCheck,
      description: 'Practice professional HR interviews using AI. Receive instant feedback on your communication skills and interview performance.',
      features: [
        'HR Questions',
        'AI Evaluation',
        'Confidence Analysis',
        'Grammar Review',
        'Professional Suggestions',
        'Model Answers'
      ]
    },
    {
      title: 'ATS Resume Analyzer',
      icon: FileText,
      description: 'Upload your resume and receive an AI-powered ATS analysis to improve your chances of getting shortlisted.',
      features: [
        'ATS Compatibility Score',
        'Missing Skills',
        'Resume Strengths',
        'Resume Improvements',
        'Personalized Interview Questions'
      ]
    },
    {
      title: 'Coding Playground',
      icon: Code2,
      description: 'A complete coding practice environment built specifically for placement preparation.',
      features: [
        'Company Coding Challenges',
        'Online Code Editor',
        'Multiple Programming Languages',
        'Run & Submit Code',
        'AI Explanation',
        'AI Coding Interview Follow-up'
      ]
    },
    {
      title: 'Question Bank',
      icon: BookOpen,
      description: 'Explore company-specific coding and placement questions with detailed explanations.',
      features: [
        'Company Filters',
        'Search by Topic',
        'Difficulty Levels',
        'AI Explanations',
        'Related Questions',
        'Bookmark Questions'
      ]
    },
    {
      title: 'Billing & Plans',
      icon: CreditCard,
      description: 'Manage subscriptions and premium content.',
      features: [
        'Premium Coding Sets',
        'Purchase History',
        'Plan Management',
        'Razorpay Payments'
      ]
    }
  ];

  const valueProps = [
    {
      title: 'AI-Powered Learning',
      icon: Sparkles,
      description: 'Receive intelligent explanations, interview feedback, and personalized recommendations.'
    },
    {
      title: 'Company-Specific Preparation',
      icon: ShieldCheck,
      description: 'Prepare for TCS, Wipro, Infosys, Cognizant, Accenture, Capgemini, HCL, and Tech Mahindra.'
    },
    {
      title: 'All-in-One Platform',
      icon: Layers,
      description: 'Coding practice, aptitude, mock tests, HR interviews, resume analysis, and placement tracking—all in one place.'
    },
    {
      title: 'Affordable for Students',
      icon: Award,
      description: 'Designed to provide high-quality placement preparation at a student-friendly cost.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-16 px-4">
      
      {/* 1. HERO SECTION */}
      <section className="text-center py-12 md:py-16 border border-border bg-card/25 rounded-3xl relative overflow-hidden space-y-4 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        
        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full w-fit mx-auto">
          About PlaceMe AI
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent pt-1">
          PlaceMe AI
        </h1>
        <p className="text-md font-bold text-foreground max-w-lg mx-auto">
          AI-Powered Placement Preparation Platform
        </p>
        <p className="text-xs text-muted-foreground tracking-wide font-medium">
          Helping Engineering Students Prepare Smarter.
        </p>
      </section>

      {/* 2. FOUNDER SECTION */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Meet the Founder</h2>
          <p className="text-xs text-muted-foreground">The builder behind the intelligent placement assistant.</p>
        </div>

        <div className="border border-border bg-card/45 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
          
          {/* Circular NH Logo */}
          <div className="relative w-[180px] h-[180px] rounded-full border-2 border-primary/35 bg-transparent flex-shrink-0 flex items-center justify-center p-1.5 shadow-lg transition-transform hover:scale-105 duration-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/nh-logo.jpg" 
              alt="N Hari Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">
              Founder & Developer
            </span>
            <h3 className="text-lg font-black text-foreground pt-1.5">N Hariharan</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">Creator of PlaceMe AI</p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
            Creator of PlaceMe AI, an AI-powered placement preparation platform helping engineering students improve their coding, aptitude, technical interview, HR interview, and resume skills through an intelligent, affordable, and interactive learning experience.
          </p>

          {/* Social Links with exact label requests */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-muted-foreground">
            <a 
              href="https://www.linkedin.com/in/n-hariharan-9521562a4" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-border rounded-xl hover:text-primary transition bg-background/50"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span>LinkedIn</span>
            </a>

            <a 
              href="https://github.com/hariharan202135" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-border rounded-xl hover:text-primary transition bg-background/50"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>

            <a 
              href="mailto:hariharannandha2005@gmail.com" 
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-border rounded-xl hover:text-primary transition bg-background/50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. ABOUT PLATFORM */}
      <section className="border border-border bg-card/45 rounded-3xl p-8 space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Info className="w-5 h-5" />
          <h2 className="text-lg font-bold text-foreground">About PlaceMe AI</h2>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-4 leading-relaxed">
          <p>
            PlaceMe AI is an AI-powered placement preparation platform designed to help engineering students prepare confidently for campus placements and technical interviews through one unified platform.
          </p>
          <p>
            Instead of using multiple websites for coding practice, aptitude preparation, HR interview preparation, resume analysis, and company-specific preparation, PlaceMe AI brings everything together into a single intelligent learning experience.
          </p>
          
          <div className="space-y-3.5 pt-2">
            <span className="font-bold text-foreground block text-sm">Students can prepare for leading companies including:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                'TCS', 'Wipro', 'Infosys', 'Cognizant', 
                'Accenture', 'Capgemini', 'HCL', 'Tech Mahindra'
              ].map((company) => (
                <div 
                  key={company} 
                  className="px-3 py-2 border border-border/80 bg-background/50 rounded-xl text-center font-bold text-[10px] text-foreground/80 hover:border-primary/30 transition shadow-sm"
                >
                  • {company}
                </div>
              ))}
            </div>
          </div>

          <p className="pt-2">
            The platform combines AI-powered learning with structured placement preparation to help students improve consistently and become interview-ready.
          </p>
          <p>
            The mission of PlaceMe AI is to make placement preparation simple, affordable, interactive, intelligent, and accessible for every engineering student.
          </p>
        </div>
      </section>

      {/* 4. PLATFORM MODULES */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Platform Modules</h2>
          <p className="text-xs text-muted-foreground">Every learning component you need to prepare smarter.</p>
        </div>

        {/* Responsive Grid that adapts automatically to 1 col (mobile), 2 cols (tablet), 3 cols (desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const IconComponent = mod.icon;
            return (
              <div 
                key={mod.title}
                className="border border-border bg-card/25 rounded-2xl p-5 space-y-4 hover:border-primary/25 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-sm text-foreground">{mod.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{mod.description}</p>
                </div>

                <div className="border-t border-border/40 pt-3 space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Features</span>
                  <ul className="space-y-1.5">
                    {mod.features.map((feat) => (
                      <li key={feat} className="text-[10px] text-foreground/80 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 bg-primary/80 rounded-full flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. WHY CHOOSE PLACEME AI */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Why Choose PlaceMe AI?</h2>
          <p className="text-xs text-muted-foreground">High quality placement tools at a student-friendly baseline.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueProps.map((prop) => {
            const Icon = prop.icon;
            return (
              <div 
                key={prop.title}
                className="border border-border bg-card/25 rounded-2xl p-5 space-y-3 hover:border-primary/25 hover:bg-card/45 transition duration-300"
              >
                <div className="bg-primary/10 text-primary p-2 rounded-xl w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{prop.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{prop.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. VISION */}
      <section className="border border-primary/20 bg-primary/[0.01] p-8 rounded-3xl text-center relative overflow-hidden max-w-3xl mx-auto space-y-3 shadow-sm">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Vision</span>
        <blockquote className="text-sm font-medium italic text-foreground leading-relaxed max-w-xl mx-auto">
          "Our vision is to empower engineering students with an intelligent and affordable placement preparation platform that combines AI, structured learning, and company-specific practice to improve confidence, technical skills, and interview success."
        </blockquote>
      </section>

      {/* 7. CONTACT & INQUIRIES */}
      <section className="border border-border bg-card/30 rounded-3xl p-6 max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-base font-bold text-foreground">Contact & Support</h2>
        <p className="text-xs text-muted-foreground">
          For platform feedback, suggestions, or technical support, reach out directly at:
        </p>
        <div className="flex flex-col items-center justify-center gap-3 pt-1 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Email:</span>
            <a href="mailto:hariharannadha2005@gmail.com" className="text-primary hover:underline font-mono">
              hariharannadha2005@gmail.com
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Phone:</span>
            <a href="tel:+919894995725" className="text-primary hover:underline font-mono">
              +91 9894995725
            </a>
          </div>
          <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1">
            Response turnaround within 24 hours
          </span>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-border/80 pt-8 text-center space-y-4">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-muted-foreground font-medium">
          <span>Built with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
          <span>for Engineering Students</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs font-bold text-foreground">PlaceMe AI</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
            AI-Powered Placement Preparation Platform
          </div>
        </div>
      </footer>

    </div>
  );
}
