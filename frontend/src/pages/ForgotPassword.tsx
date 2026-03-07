import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';

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

interface ForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onBackToLogin,
}) => {
  const [step, setStep] = useState<'forgot' | 'reset'>('forgot');
  const [forgotEmail, setForgotEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync initialEmail when parent updates it (e.g. user typed email before clicking forgot)
  useEffect(() => {
    setForgotEmail(initialEmail);
  }, [initialEmail]);

  // Countdown timer
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

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(newPassword) })),
    [newPassword]
  );
  const allRulesPassed = ruleResults.every(r => r.passed);
  const passwordMismatch = confirmTouched && confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  if (!isOpen) return null;

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(30);
  };

  const clearForm = () => {
    setStep('forgot');
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasswordTouched(false);
    setConfirmTouched(false);
    setError('');
    setSuccess('');
    setResendCooldown(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  };

  const handleBackToLogin = () => { clearForm(); onBackToLogin(); };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess('OTP sent! Check your email inbox.');
      startCooldown();
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordTouched(true);
    setConfirmTouched(true);
    setError(''); setSuccess('');

    if (!allRulesPassed) { setError('Password does not meet all requirements.'); return; }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email: forgotEmail, otp, newPassword });
      setSuccess('Password reset successfully! You can now sign in.');
      setTimeout(() => { clearForm(); onBackToLogin(); }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToLogin}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {step === 'forgot' ? 'Forgot Password' : 'Reset Password'}
                </h2>
                <p className="text-sm text-slate-400">
                  {step === 'forgot'
                    ? "We'll send an OTP to your email"
                    : `OTP sent to ${forgotEmail}`}
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
          <div className="p-6 space-y-5">
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

            {/* Step 1: Enter email */}
            {step === 'forgot' && (
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

            {/* Step 2: Enter OTP + new password */}
            {step === 'reset' && (
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
                      type="password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setNewPasswordTouched(true); }}
                      required
                    />
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
                      type="password"
                      className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 bg-slate-950 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors ${
                        passwordMismatch
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-slate-700 focus:border-violet-500'
                      }`}
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={e => { setConfirmNewPassword(e.target.value); setConfirmTouched(true); }}
                      required
                    />
                  </div>
                  {passwordMismatch && (
                    <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-xs text-red-400 shadow-lg">
                      <span className="mr-1">⚠</span> Passwords do not match
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500/40" />
                    </div>
                  )}
                </div>

                {/* Resend row */}
                <div className="flex items-center justify-end gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};
