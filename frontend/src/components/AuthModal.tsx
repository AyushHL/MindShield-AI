import React, { useState } from 'react';
import { X, Mail, Lock, User, Chrome } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const reset = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setUsername(''); setError('');
  };

  const switchTab = (t: 'login' | 'signup') => { setTab(t); reset(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }

    setIsLoading(true);
    try {
      if (tab === 'login') {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onClose();
        navigate('/dashboard');
      } else {
        await api.post('/auth/register', { username, email, password });
        setTab('login');
        setError('');
        reset();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-slate-400">
                {tab === 'login' ? 'Sign in to MindShield AI' : 'Start detecting risk today'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex rounded-xl bg-slate-950 p-1">
              {(['login', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200',
                    tab === t
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {tab === 'signup' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {tab === 'login' && (
                <div className="text-right">
                  <button type="button" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" isLoading={isLoading}>
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500">or continue with</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 py-2.5 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white hover:border-slate-600"
            >
              <Chrome className="h-4 w-4" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
