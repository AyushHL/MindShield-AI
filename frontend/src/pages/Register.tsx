import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',          test: (pw) => pw.length >= 8 },
  { label: 'No more than 64 characters',      test: (pw) => pw.length <= 64 },
  { label: 'At least one uppercase letter',   test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least one lowercase letter',   test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least one number',             test: (pw) => /[0-9]/.test(pw) },
  { label: 'At least one special character',  test: (pw) => /[@#$%&*!^()_\-+=[\]{};:'",.<>?/\\|`~]/.test(pw) },
  { label: 'No spaces',                       test: (pw) => !/\s/.test(pw) },
];

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password]
  );

  const allRulesPassed = ruleResults.every((r) => r.passed);
  const passwordMismatch = confirmTouched && confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    setConfirmTouched(true);

    if (!allRulesPassed) {
      setError('Password does not meet all requirements');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/register', { username, email, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Create an account</h2>
          <p className="mt-2 text-sm text-gray-400">Start using AI Shield today</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password field + live rules checklist */}
            <div>
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
              />
              {passwordTouched && password.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                  {ruleResults.map((rule) => (
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

            {/* Confirm password field + live mismatch popup */}
            <div className="relative">
              <Input
                label="Confirm Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmTouched(true); }}
                error={passwordMismatch ? ' ' : undefined}
              />
              {passwordMismatch && (
                <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-xs text-red-400 shadow-lg">
                  <span className="mr-1">⚠</span> Passwords do not match
                  {/* Arrow pointing upward */}
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500/40" />
                </div>
              )}
            </div>
          </div>

          <Button className="w-full" type="submit" isLoading={isLoading}>
            Sign up
          </Button>
          <div className="text-center text-sm">
            <span className="text-gray-400">Already have an account? </span>
            <a href="/login" className="font-medium text-violet-500 hover:text-violet-400">
              Sign in
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
};