import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BrainCircuit, AlertTriangle,
  Settings, Mail, LogOut, Shield, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/dashboard',                   icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/dashboard/reports',           icon: FileText,        label: 'Reports'          },
  { to: '/dashboard/insights',          icon: BrainCircuit,    label: 'AI Insights'      },
  { to: '/dashboard/crisis-protocols',  icon: AlertTriangle,   label: 'Crisis Protocols' },
  { to: '/dashboard/settings',          icon: Settings,        label: 'Settings'         },
];

const bottomItems = [
  { to: '/dashboard/contact', icon: Mail, label: 'Contact Us' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className={cn(
        'flex h-16 items-center border-b border-slate-800 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-violet-500 shrink-0" />
            <span className="font-bold text-white tracking-tight">MindShield</span>
          </div>
        )}
        {collapsed && <Shield className="h-7 w-7 text-violet-500" />}
        <button
          onClick={onToggle}
          className={cn(
            'rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 pt-4 stagger">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-slide-in-left',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {!collapsed && (
              <span className="transition-all duration-200 overflow-hidden whitespace-nowrap">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-2 space-y-1">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="transition-all duration-200 overflow-hidden whitespace-nowrap">
                {label}
              </span>
            )}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
};
