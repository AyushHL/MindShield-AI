import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
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

  const handleGoogleLogin = () => {
    const g = (window as any).google;
    if (!g) { setError('Google Sign-In is not available. Please try again.'); return; }
    g.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        setIsLoading(true);
        try {
          const res = await api.post('/auth/google', { credential: response.credential });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          onClose();
          navigate('/dashboard');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Google sign-in failed. Try again.');
        } finally {
          setIsLoading(false);
        }
      },
    });
    g.accounts.id.prompt();
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
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 py-2.5 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
