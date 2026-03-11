import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, Shield, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NotificationBell } from './NotificationBell';

interface DashboardNavbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); }
  catch { return {}; }
};

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ sidebarCollapsed, onMobileMenuToggle }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(readUser);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown on outside click
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);

    // Re-sync user (avatar, username…) whenever Settings saves
    const syncUser = () => setUser(readUser());
    window.addEventListener('user-updated', syncUser);

    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('user-updated', syncUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 md:px-6 transition-all duration-300',
      // Mobile: full width. Desktop: offset by sidebar width.
      'left-0 md:left-16',
      !sidebarCollapsed && 'md:left-60'
    )}>
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Shield className="h-5 w-5 text-violet-500" />
        <span className="text-sm font-medium text-slate-300 hidden sm:inline">MindShield AI</span>
        <span className="text-slate-600 hidden sm:inline">/</span>
        <span className="text-sm text-slate-500 hidden sm:inline">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div ref={ref} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-2 sm:px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-slate-700 hover:text-white"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white">
              {user.avatar
                ? <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                : (user.username?.[0]?.toUpperCase() ?? 'U')
              }
            </div>
            <span className="hidden sm:block">{user.username}</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/40 py-1 animate-scale-in">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-sm font-bold text-white">
                  {user.avatar
                    ? <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                    : (user.username?.[0]?.toUpperCase() ?? 'U')
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.username}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const PublicNavbar: React.FC<{ onLoginClick: () => void; onSignupClick: () => void }> = ({
  onLoginClick, onSignupClick
}) => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-violet-500" />
          <span className="text-lg font-bold text-white tracking-tight">MindShield AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Contact'].map(item => (
            <button
              key={item}
              onClick={() => {
                const id = item.toLowerCase().replace(/\s/g, '-');
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* Desktop auth buttons */}
          {!token ? (
            <>
              <button onClick={onLoginClick} className="hidden sm:inline-flex text-sm text-slate-400 transition-colors hover:text-white px-3 py-2">
                Sign in
              </button>
              <button
                onClick={onSignupClick}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-500 shadow-lg shadow-violet-500/20"
              >
                Get Started
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-500"
            >
              Dashboard
            </button>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md animate-fade-in-up">
          <div className="flex flex-col gap-1 px-4 py-3">
            {['Features', 'How It Works', 'Contact'].map(item => (
              <button
                key={item}
                onClick={() => {
                  const id = item.toLowerCase().replace(/\s/g, '-');
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="text-sm text-slate-400 transition-colors hover:text-white text-left px-3 py-2.5 rounded-lg hover:bg-slate-800"
              >
                {item}
              </button>
            ))}
            {!token && (
              <button
                onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                className="text-sm text-slate-400 transition-colors hover:text-white text-left px-3 py-2.5 rounded-lg hover:bg-slate-800 sm:hidden"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};