import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardNavbar } from './Navbar';

export const DashboardLayout: React.FC = () => {
  const token = localStorage.getItem('token');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close mobile sidebar on route change (handled by Outlet re-render)
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
  }, []);

  if (!token) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <DashboardNavbar
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={() => setMobileOpen(v => !v)}
      />
      <main
        className="transition-all duration-300 pt-16"
        style={{ marginLeft: isMobile ? 0 : (collapsed ? 64 : 240) }}
      >
        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
