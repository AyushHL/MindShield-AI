import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Settings, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DashboardNavbarProps {
  sidebarCollapsed: boolean;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ sidebarCollapsed }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { username: 'User', email: 'user@example.com' };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 transition-all duration-300',
      sidebarCollapsed ? 'left-16' : 'left-60'
    )}>
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-violet-500" />
        <span className="text-sm font-medium text-slate-300">MindShield AI</span>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-500">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
        </button>

        <div ref={ref} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-slate-700 hover:text-white"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white">
              {user.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden sm:block">{user.username}</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/40 py-1 animate-scale-in">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-medium text-white">{user.username}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
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

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-violet-500" />
          <span className="text-lg font-bold text-white tracking-tight">MindShield AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Contact'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
              className="text-sm text-slate-400 transition-colors hover:text-white">
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!token ? (
            <>
              <button onClick={onLoginClick} className="text-sm text-slate-400 transition-colors hover:text-white px-3 py-2">
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
        </div>
      </div>
    </nav>
  );
};