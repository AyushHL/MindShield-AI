import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BrainCircuit, AlertTriangle,
  Settings, Mail, LogOut, Shield, ChevronLeft, ChevronRight, X,
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
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    onMobileClose();
  };

  const sidebarContent = (isMobileView: boolean) => {
    const isCollapsed = isMobileView ? false : collapsed;
    return (
      <>
        <div className={cn(
          'flex h-16 items-center border-b border-slate-800 px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-violet-500 shrink-0" />
              <span className="font-bold text-white tracking-tight">MindShield</span>
            </div>
          )}
          {isCollapsed && <Shield className="h-7 w-7 text-violet-500" />}
          {isMobileView ? (
            <button
              onClick={onMobileClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onToggle}
              className={cn(
                'rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white',
                isCollapsed && 'hidden'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {!isMobileView && isCollapsed && (
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
              onClick={isMobileView ? handleNavClick : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-slide-in-left',
                  isCollapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                )
              }
              title={isCollapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {!isCollapsed && (
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
              onClick={isMobileView ? handleNavClick : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                )
              }
              title={isCollapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <span className="transition-all duration-200 overflow-hidden whitespace-nowrap">
                  {label}
                </span>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => { handleLogout(); if (isMobileView) onMobileClose(); }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400',
              isCollapsed ? 'justify-center' : ''
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden md:flex h-[100dvh] flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 flex h-[100dvh] w-64 flex-col border-r border-slate-800 bg-slate-950 shadow-2xl animate-slide-in-left">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
