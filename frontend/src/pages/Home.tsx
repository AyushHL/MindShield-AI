import { useState } from 'react';
import { Shield, Brain, Activity, Lock, ArrowRight, Zap, Users, BarChart3, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicNavbar } from '../components/layout/Navbar';
import { AuthModal } from '../components/AuthModal';

export const Home = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const openSignup = () => { setAuthMode('signup'); setAuthOpen(true); };
  const openLogin  = () => { setAuthMode('login');  setAuthOpen(true); };

  return (
    <motion.div
      className="min-h-screen bg-slate-950 text-white"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <PublicNavbar onLoginClick={openLogin} onSignupClick={openSignup} />
      {authOpen && <AuthModal isOpen={authOpen} defaultTab={authMode} onClose={() => setAuthOpen(false)} />}
      
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-600/8 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
            <Zap className="h-3 w-3" /> Bi-LSTM Based Risk Classification
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            Detect Mental Health
            <span className="block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Crisis with AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Early-warning platform powered by a Bi-LSTM neural network. Analyse text, messages, or documents for
            suicidal ideation risk — with clinical-grade classification in real time.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button onClick={openSignup} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:bg-violet-500 hover:shadow-violet-500/40">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:border-slate-600 hover:text-white"
            >
              How It Works
            </button>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            {['No Risk Classification', 'Potential Risk Detection', 'High Risk — Urgent Alert'].map(t => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">Capabilities</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Built for accuracy and speed</h2>
            <p className="mt-4 text-slate-400">Three-tier risk classification aligned with clinical standards.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: Brain, title: 'Bi-LSTM Architecture', desc: 'Bidirectional LSTM model processes text in both directions to capture full semantic context of crisis language.' },
              { icon: Activity, title: 'Real-time Inference', desc: 'Sub-second risk assessment. Enter text or upload documents for instant classification and score.' },
              { icon: Lock, title: 'Secure & Private', desc: 'JWT-authenticated API, encrypted transport, and no persistent raw text storage.' },
              { icon: BarChart3, title: 'Risk Score 0–100', desc: 'Continuous risk score with class probabilities — not just a label, but a full confidence breakdown.' },
              { icon: Users, title: 'User Management', desc: 'Full authentication system with account history, allowing review of past analysis sessions.' },
              { icon: Zap, title: 'File Upload', desc: 'Analyse PDF, DOCX, and plain text files in addition to typed input for comprehensive coverage.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all hover:border-violet-500/30 hover:bg-slate-900/80">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900/40">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">Process</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">How It Works</h2>
          </div>
          <div className="relative space-y-8">
            {[
              { step: '01', title: 'Sign Up & Authenticate', desc: 'Create your account. All API calls are secured via JWT tokens.' },
              { step: '02', title: 'Submit Text or Document', desc: 'Paste text directly or upload a PDF / Word file. The backend extracts and preprocesses the content.' },
              { step: '03', title: 'Bi-LSTM Inference', desc: 'The Python ML service tokenizes, applies NLP preprocessing, and runs the trained model to generate probabilities.' },
              { step: '04', title: 'Review Risk Classification', desc: 'View the classification (No Risk / Potential Risk / High Risk — Urgent) with score, confidence, and AI recommendation.' },
            ].map(({ step, title, desc }, i) => (
              <div key={step} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 border border-violet-500/30 text-sm font-bold text-violet-400">{step}</div>
                  {i < 3 && <div className="mt-2 flex-1 w-px bg-slate-800" />}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24 px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-cyan-600/5 p-12 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-violet-400" />
          <h2 className="text-3xl font-bold text-white">Start detecting risk today</h2>
          <p className="mt-3 text-slate-400">Free for research and academic use. Built at Delhi Technological University.</p>
          <button onClick={openSignup} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:bg-violet-500">
            Create Free Account <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-500" />
            <span className="font-semibold text-slate-300">MindShield AI</span>
            <span>· Delhi Technological University, Delhi, India </span>
          </div>
          <p>© {new Date().getFullYear()} MindShield. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  );
};