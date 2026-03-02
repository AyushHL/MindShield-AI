import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Contact } from './pages/Contact';
import { DashboardLayout } from './components/layout/DashboardLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Dashboard (auth guard inside DashboardLayout) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/contact" element={<Contact />} />
          <Route path="/dashboard/reports" element={<Dashboard />} />
          <Route path="/dashboard/insights" element={<Dashboard />} />
          <Route path="/dashboard/users" element={<Dashboard />} />
          <Route path="/dashboard/settings" element={<Dashboard />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/contact" element={<Navigate to="/dashboard/contact" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}