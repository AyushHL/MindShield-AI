import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Mail, Lock, User, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',         test: (pw) => pw.length >= 8 },
  { label: 'No more than 64 characters',     test: (pw) => pw.length <= 64 },
  { label: 'At least one uppercase letter',  test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least one lowercase letter',  test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least one number',            test: (pw) => /[0-9]/.test(pw) },
  { label: 'At least one special character', test: (pw) => /[@#$%&*!^()_\-+=[\]{};:'",.<>?/\\|`~]/.test(pw) },
  { label: 'No spaces',                      test: (pw) => !/\s/.test(pw) },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot' | 'reset'>(defaultTab);

  // login / signup fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  // toggle visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  // signup password touched
  const [signupPasswordTouched, setSignupPasswordTouched] = useState(false);
  const [signupConfirmTouched, setSignupConfirmTouched] = useState(false);

  // forgot / reset fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmNewTouched, setConfirmNewTouched] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown > 0]);

  const signupRuleResults = useMemo(
    () => PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(password) })),
    [password]
  );
  const signupAllRulesPassed = signupRuleResults.every(r => r.passed);
  const signupPasswordMismatch = signupConfirmTouched && confirmPassword.length > 0 && password !== confirmPassword;

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(newPassword) })),
    [newPassword]
  );
  const allRulesPassed = ruleResults.every(r => r.passed);
  const passwordMismatch = confirmNewTouched && confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  if (!isOpen) return null;

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(30);
  };

  const resetLoginSignup = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setUsername(''); setError(''); setSuccess('');
    setSignupPasswordTouched(false); setSignupConfirmTouched(false);
  };

  const resetForgot = () => {
    setOtp(''); setNewPassword(''); setConfirmNewPassword('');
    setNewPasswordTouched(false); setConfirmNewTouched(false);
    setError(''); setSuccess('');
    setResendCooldown(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  };

  const switchTab = (t: 'login' | 'signup') => { setTab(t); resetLoginSignup(); };

  // Login / Signup submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'signup') {
      setSignupPasswordTouched(true); setSignupConfirmTouched(true);
      if (!signupAllRulesPassed) { setError('Password does not meet all requirements.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
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
        resetLoginSignup();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess('OTP sent! Check your email inbox.');
      startCooldown();
      setTab('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP (stays on reset step)
  const handleResendOtp = async () => {
    setError(''); setSuccess('');
    setIsResending(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setOtp('');
      setSuccess('New OTP sent! Check your email inbox.');
      startCooldown();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordTouched(true); setConfirmNewTouched(true);
    setError(''); setSuccess('');
    if (!allRulesPassed) { setError('Password does not meet all requirements.'); return; }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match.'); return; }
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email: forgotEmail, otp, newPassword });
      setSuccess('Password reset successfully! You can now sign in.');
      setTimeout(() => { resetForgot(); setTab('login'); }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google login
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

  const isForgotFlow = tab === 'forgot' || tab === 'reset';

  return (
    /* Single persistent overlay — never unmounts on tab switch */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60 flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              {isForgotFlow && (
                <button
                  onClick={() => { resetForgot(); setForgotEmail(''); setTab('login'); }}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {tab === 'login'   ? 'Welcome back'
                  : tab === 'signup'  ? 'Create account'
                  : tab === 'forgot'  ? 'Forgot Password'
                  :                    'Reset Password'}
                </h2>
                <p className="text-sm text-slate-400">
                  {tab === 'login'   ? 'Sign in to MindShield AI'
                  : tab === 'signup'  ? 'Start detecting risk today'
                  : tab === 'forgot'  ? "We'll send an OTP to your email"
                  :                    `OTP sent to ${forgotEmail}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-scroll p-6 space-y-5 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6d28d9 transparent' }}>

            {/* Login / Signup tab switcher */}
            {!isForgotFlow && (
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
            )}

            {/* Error / Success banners */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            {/* Login / Signup form */}
            {!isForgotFlow && (
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

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="Password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); if (tab === 'signup') setSignupPasswordTouched(true); }}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {tab === 'signup' && signupPasswordTouched && password.length > 0 && (
                    <ul className="mt-2 space-y-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                      {signupRuleResults.map(rule => (
                        <li key={rule.label} className="flex items-center gap-2 text-xs">
                          <span className={rule.passed ? 'text-emerald-400' : 'text-red-400'}>
                            {rule.passed ? '✓' : '✗'}
                          </span>
                          <span className={rule.passed ? 'text-emerald-400' : 'text-slate-400'}>
                            {rule.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {tab === 'signup' && (
                  <div className="relative">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 bg-slate-950 focus:outline-none focus:ring-1 transition-colors ${
                          signupPasswordMismatch
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-700 focus:border-violet-500 focus:ring-violet-500'
                        }`}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setSignupConfirmTouched(true); }}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirm(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupPasswordMismatch && (
                      <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-xs text-red-400 shadow-lg">
                        <span className="mr-1">⚠</span> Passwords do not match
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500/40" />
                      </div>
                    )}
                  </div>
                )}

                {tab === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email); setError(''); setSuccess(''); setTab('forgot'); }}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            )}

            {/* Forgot: enter email */}
            {tab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Your registered email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Send OTP
                </Button>
              </form>
            )}

            {/* Reset: OTP + new password */}
            {tab === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* OTP */}
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 tracking-widest"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>

                {/* New password + live rules */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setNewPasswordTouched(true); }}
                      required
                    />
                    <button type="button" onClick={() => setShowNewPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPasswordTouched && newPassword.length > 0 && (
                    <ul className="mt-2 space-y-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                      {ruleResults.map(rule => (
                        <li key={rule.label} className="flex items-center gap-2 text-xs">
                          <span className={rule.passed ? 'text-emerald-400' : 'text-red-400'}>
                            {rule.passed ? '✓' : '✗'}
                          </span>
                          <span className={rule.passed ? 'text-emerald-400' : 'text-slate-400'}>
                            {rule.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirm new password + mismatch tooltip */}
                <div className="relative">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showConfirmNew ? 'text' : 'password'}
                      className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 bg-slate-950 focus:outline-none focus:ring-1 transition-colors ${
                        passwordMismatch
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-700 focus:border-violet-500 focus:ring-violet-500'
                      }`}
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={e => { setConfirmNewPassword(e.target.value); setConfirmNewTouched(true); }}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmNew(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                      {showConfirmNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-xs text-red-400 shadow-lg">
                      <span className="mr-1">⚠</span> Passwords do not match
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500/40" />
                    </div>
                  )}
                </div>

                {/* Resend cooldown */}
                <div className="flex items-center justify-end">
                  {resendCooldown > 0 ? (
                    <span className="text-xs text-slate-500">
                      Resend OTP in{' '}
                      <span className="text-violet-400 tabular-nums">{resendCooldown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? 'Sending…' : 'Resend OTP'}
                    </button>
                  )}
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Reset Password
                </Button>
              </form>
            )}

            {/* Google / divider — only for login/signup */}
            {!isForgotFlow && (
              <>
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
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

