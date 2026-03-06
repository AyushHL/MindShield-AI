import { useState, useEffect, useRef, useMemo } from 'react';
import {
  User, Lock, Trash2, ShieldCheck, Save, Eye, EyeOff,
  CheckCircle2, AlertTriangle, XCircle, Calendar, Mail,
  Camera, ImageOff, Upload,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const toastIcon = { success: CheckCircle2, error: XCircle, warning: AlertTriangle };
const toastColor: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  error:   'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
};

export const Settings = () => {
  const navigate  = useNavigate();
  const toastId   = useRef(0);
  const fileRef   = useRef<HTMLInputElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Profile state
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile,        setProfile]        = useState({ username: stored.username || '', email: stored.email || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [joinedAt,       setJoinedAt]       = useState<string | null>(null);

  // Avatar state
  const [avatar,        setAvatar]        = useState<string | null>(stored.avatar ?? null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password rules (same as Register)
  const PASSWORD_RULES = [
    { label: 'At least 8 characters',         test: (pw: string) => pw.length >= 8 },
    { label: 'No more than 64 characters',     test: (pw: string) => pw.length <= 64 },
    { label: 'At least one uppercase letter',  test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'At least one lowercase letter',  test: (pw: string) => /[a-z]/.test(pw) },
    { label: 'At least one number',            test: (pw: string) => /[0-9]/.test(pw) },
    { label: 'At least one special character', test: (pw: string) => /[@#$%&*!^()_\-+=[\]{};:'",.<>?/\\|`~]/.test(pw) },
    { label: 'No spaces',                      test: (pw: string) => !/\s/.test(pw) },
  ];

  // Password state
  const [pwd,           setPwd]           = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd,       setShowPwd]       = useState({ current: false, newPwd: false, confirm: false });
  const [pwdLoading,    setPwdLoading]    = useState(false);
  const [pwdNewTouched, setPwdNewTouched] = useState(false);
  const [pwdConfirmTouched, setPwdConfirmTouched] = useState(false);

  const pwdRuleResults = useMemo(
    () => PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(pwd.newPwd) })),
    [pwd.newPwd]
  );
  const allPwdRulesPassed = pwdRuleResults.every(r => r.passed);
  const pwdMismatch = pwdConfirmTouched && pwd.confirm.length > 0 && pwd.newPwd !== pwd.confirm;

  // Delete state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword,    setDeletePassword]    = useState('');
  const [deleteLoading,     setDeleteLoading]     = useState(false);

  // Google / password-less state
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    api.get('/auth/profile')
      .then(r => {
        setProfile({ username: r.data.username, email: r.data.email });
        setAvatar(r.data.avatar ?? null);
        setHasPassword(!!r.data.hasPassword);
        if (r.data.createdAt) {
          setJoinedAt(new Date(r.data.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
          }));
        }
      })
      .catch(() => {/* silently use cached */});
  }, []);

  // Avatar: pick file → local preview
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) { addToast('error', 'Only JPEG, PNG, GIF and WebP are allowed.'); return; }
    if (file.size > 2 * 1024 * 1024)  { addToast('error', 'Image must be smaller than 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Avatar: upload
  const handleAvatarUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { addToast('warning', 'Pick an image first.'); return; }
    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarLoading(true);
    try {
      const { data } = await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatar(data.avatar);
      setAvatarPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      const updated = { ...JSON.parse(localStorage.getItem('user') || '{}'), avatar: data.avatar };
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('user-updated'));
      addToast('success', 'Profile photo updated.');
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Upload failed.');
    } finally { setAvatarLoading(false); }
  };

  // Avatar: delete
  const handleAvatarDelete = async () => {
    setAvatarLoading(true);
    try {
      await api.delete('/auth/avatar');
      setAvatar(null);
      setAvatarPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      const updated = { ...JSON.parse(localStorage.getItem('user') || '{}'), avatar: null };
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('user-updated'));
      addToast('success', 'Profile photo removed.');
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to remove photo.');
    } finally { setAvatarLoading(false); }
  };

  // Profile save
  const handleProfileSave = async () => {
    if (!profile.username.trim() || !profile.email.trim()) {
      addToast('error', 'Username and email cannot be empty.'); return;
    }
    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      const updated = { ...stored, ...data.user };
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('user-updated'));
      addToast('success', 'Profile updated successfully.');
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to update profile.');
    } finally { setProfileLoading(false); }
  };

  // Password change
  const handlePasswordChange = async () => {
    setPwdNewTouched(true);
    setPwdConfirmTouched(true);
    if (!pwd.current || !pwd.newPwd || !pwd.confirm) {
      addToast('error', 'All password fields are required.'); return;
    }
    if (!allPwdRulesPassed) {
      addToast('error', 'New password does not meet all requirements'); return;
    }
    if (pwd.newPwd === pwd.current) { addToast('error', 'New password must be different from your current password'); return; }
    if (pwd.newPwd !== pwd.confirm) { addToast('error', 'New passwords do not match.'); return; }
    setPwdLoading(true);
    try {
      await api.put('/auth/password', { currentPassword: pwd.current, newPassword: pwd.newPwd });
      setPwd({ current: '', newPwd: '', confirm: '' });
      addToast('success', 'Password changed successfully.');
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to change password.');
    } finally { setPwdLoading(false); }
  };

  // Set password (Google-only users)
  const handleSetPassword = async () => {
    setPwdNewTouched(true);
    setPwdConfirmTouched(true);
    if (!pwd.newPwd || !pwd.confirm) {
      addToast('error', 'All password fields are required.'); return;
    }
    if (!allPwdRulesPassed) {
      addToast('error', 'Password does not meet all requirements'); return;
    }
    if (pwd.newPwd !== pwd.confirm) { addToast('error', 'Passwords do not match.'); return; }
    setPwdLoading(true);
    try {
      await api.post('/auth/set-password', { newPassword: pwd.newPwd });
      setPwd({ current: '', newPwd: '', confirm: '' });
      setPwdNewTouched(false);
      setPwdConfirmTouched(false);
      setHasPassword(true);
      addToast('success', 'Password set successfully. You can now sign in with your password.');
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to set password.');
    } finally { setPwdLoading(false); }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') { addToast('warning', 'Type DELETE exactly to confirm.'); return; }
    if (!deletePassword) { addToast('error', 'Enter your password to confirm deletion.'); return; }
    setDeleteLoading(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  // Derived
  const displayAvatar = avatarPreview ?? avatar;
  const initial = (profile.username?.[0] || '?').toUpperCase();

  return (
    <div className="relative min-h-full p-6 md:p-8">

      {/* Toast stack */}
      <div className="fixed right-5 top-5 z-50 flex flex-col gap-2">
        {toasts.map(t => {
          const Icon = toastIcon[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm transition-all animate-in fade-in slide-in-from-right-4 duration-300',
                toastColor[t.type]
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t.message}
            </div>
          );
        })}
      </div>

      <div className="mx-auto max-w-2xl space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your account profile, security, and preferences.</p>
        </div>

        {/* Account overview */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            {/* Clickable avatar */}
            <div className="group relative shrink-0">
              <div
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/15 text-xl font-bold text-violet-400 cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                {displayAvatar
                  ? <img src={displayAvatar} alt="avatar" className="h-full w-full object-cover" />
                  : initial}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change photo"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate">{profile.username || '—'}</p>
              <p className="text-sm text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {profile.email || '—'}
              </p>
              {joinedAt && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3 w-3 shrink-0" />
                  Joined {joinedAt}
                </p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active
            </div>
          </div>
        </Card>

        {/* Profile photo section */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Camera className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Profile Photo</p>
              <p className="text-xs text-slate-500">JPEG, PNG, GIF or WebP · max 2 MB</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-5">
              {/* Large preview */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-2xl font-bold text-violet-400">
                {displayAvatar
                  ? <img src={displayAvatar} alt="preview" className="h-full w-full object-cover" />
                  : initial}
              </div>
              <div className="flex flex-col gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleFilePick}
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {avatarPreview ? 'Change selection' : 'Choose photo'}
                </Button>
                {avatarPreview && (
                  <Button size="sm" onClick={handleAvatarUpload} isLoading={avatarLoading}>
                    <Camera className="h-4 w-4" />
                    Upload photo
                  </Button>
                )}
                {avatar && !avatarPreview && (
                  <Button variant="danger" size="sm" onClick={handleAvatarDelete} isLoading={avatarLoading}>
                    <ImageOff className="h-4 w-4" />
                    Remove photo
                  </Button>
                )}
                {avatarPreview && (
                  <button
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors text-left"
                    onClick={() => { setAvatarPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile section */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <User className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Profile</p>
              <p className="text-xs text-slate-500">Update your display name and email address</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <Input
              label="Username"
              value={profile.username}
              onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
              placeholder="your_username"
              autoComplete="off"
            />
            <Input
              label="Email address"
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              autoComplete="off"
            />
            <div className="flex justify-end pt-1">
              <Button onClick={handleProfileSave} isLoading={profileLoading} size="sm">
                <Save className="h-4 w-4" />
                Save Profile
              </Button>
            </div>
          </div>
        </Card>

        {/* Security section */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <Lock className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {hasPassword === false ? 'Set a Password' : 'Security'}
              </p>
              <p className="text-xs text-slate-500">
                {hasPassword === false ? 'Create a password so you can also sign in with email' : 'Change your password'}
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {hasPassword === null ? (
              <div className="py-4 text-center text-slate-500 text-sm">Loading...</div>
            ) : hasPassword ? (
              <>
                {/* Current password */}
                <div className="relative">
                  <Input
                    label="Current password"
                    type={showPwd.current ? 'text' : 'password'}
                    value={pwd.current}
                    onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-[26px] flex h-10 items-center text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* New password + live rules */}
                <div>
                  <div className="relative">
                    <Input
                      label="New password"
                      type={showPwd.newPwd ? 'text' : 'password'}
                      value={pwd.newPwd}
                      onChange={e => { setPwd(p => ({ ...p, newPwd: e.target.value })); setPwdNewTouched(true); }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPwd(p => ({ ...p, newPwd: !p.newPwd }))}
                      className="absolute right-3 top-[26px] flex h-10 items-center text-slate-500 hover:text-slate-300 transition-colors">
                      {showPwd.newPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwdNewTouched && pwd.newPwd.length > 0 && (
                    <ul className="mt-2 space-y-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                      {pwdRuleResults.map(rule => (
                        <li key={rule.label} className="flex items-center gap-2 text-xs">
                          <span className={rule.passed ? 'text-emerald-400' : 'text-red-400'}>{rule.passed ? '✓' : '✗'}</span>
                          <span className={rule.passed ? 'text-emerald-400' : 'text-slate-400'}>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirm new password + live mismatch popup */}
                <div className="relative">
                  <Input
                    label="Confirm new password"
                    type={showPwd.confirm ? 'text' : 'password'}
                    value={pwd.confirm}
                    onChange={e => { setPwd(p => ({ ...p, confirm: e.target.value })); setPwdConfirmTouched(true); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="pr-10"
                    error={pwdMismatch ? ' ' : undefined}
                  />
                  <button type="button" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-[26px] flex h-10 items-center text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {pwdMismatch && (
                    <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-xs text-red-400 shadow-lg">
                      <span className="mr-1">⚠</span> Passwords do not match
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500/40" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <Button onClick={handlePasswordChange} isLoading={pwdLoading} size="sm">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-400">
                  Your account was created with Google. Set a password to also be able to sign in with your email.
                </div>

                {/* New password + live rules */}
                <div>
                  <div className="relative">
                    <Input
                      label="New password"
                      type={showPwd.newPwd ? 'text' : 'password'}
                      value={pwd.newPwd}
                      onChange={e => { setPwd(p => ({ ...p, newPwd: e.target.value })); setPwdNewTouched(true); }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPwd(p => ({ ...p, newPwd: !p.newPwd }))}
                      className="absolute right-3 top-[26px] flex h-10 items-center text-slate-500 hover:text-slate-300 transition-colors">
                      {showPwd.newPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwdNewTouched && pwd.newPwd.length > 0 && (
                    <ul className="mt-2 space-y-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                      {pwdRuleResults.map(rule => (
                        <li key={rule.label} className="flex items-center gap-2 text-xs">
                          <span className={rule.passed ? 'text-emerald-400' : 'text-red-400'}>{rule.passed ? '✓' : '✗'}</span>
                          <span className={rule.passed ? 'text-emerald-400' : 'text-slate-400'}>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirm password */}
                <div className="relative">
                  <Input
                    label="Confirm password"
                    type={showPwd.confirm ? 'text' : 'password'}
                    value={pwd.confirm}
                    onChange={e => { setPwd(p => ({ ...p, confirm: e.target.value })); setPwdConfirmTouched(true); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="pr-10"
                    error={pwdMismatch ? ' ' : undefined}
                  />
                  <button type="button" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-[26px] flex h-10 items-center text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {pwdMismatch && (
                    <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-xs text-red-400 shadow-lg">
                      <span className="mr-1">⚠</span> Passwords do not match
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500/40" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <Button onClick={handleSetPassword} isLoading={pwdLoading} size="sm">
                    <Lock className="h-4 w-4" />
                    Set Password
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="overflow-hidden border-red-500/20">
          <div className="flex items-center gap-3 border-b border-red-500/15 bg-red-500/5 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <Trash2 className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400">Danger Zone</p>
              <p className="text-xs text-slate-500">Permanently delete your account and all data</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-slate-400">
              <p>This action <span className="text-red-400 font-medium">cannot be undone</span>. All your analyses, reports, and account data will be permanently erased.</p>
            </div>
            {hasPassword === false && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
                <span className="font-medium">Set a password first</span> — account deletion requires a password. Go to the Security section above to set one.
              </div>
            )}
            <Input
              label='Type "DELETE" to confirm'
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
            <div className="relative">
              <Input
                label="Enter your password"
                type={showPwd.confirm ? 'text' : 'password'}
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                className="absolute right-3 top-[26px] flex h-10 items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwd.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                isLoading={deleteLoading}
                disabled={deleteConfirmText !== 'DELETE' || hasPassword === false}
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};
