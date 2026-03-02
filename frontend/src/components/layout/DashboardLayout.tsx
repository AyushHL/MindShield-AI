import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardNavbar } from './Navbar';

export const DashboardLayout: React.FC = () => {
  const token = localStorage.getItem('token');
  const [collapsed, setCollapsed] = useState(false);

  if (!token) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <DashboardNavbar sidebarCollapsed={collapsed} />
      <main
        className="transition-all duration-300 pt-16"
        style={{ marginLeft: collapsed ? 64 : 240 }}
      >
        <div className="min-h-[calc(100vh-4rem)] p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
