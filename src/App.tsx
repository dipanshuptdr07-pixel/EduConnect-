import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/AppShell';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Homework from './pages/Homework';
import Attendance from './pages/Attendance';
import AI from './pages/AI';
import Leave from './pages/Leave';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Roster from './pages/Roster';
import SchoolManagement from './pages/SchoolManagement';
import GenericModule from './pages/GenericModule';
import OwnerDashboard from './pages/OwnerDashboard';

import type { Language } from './lib/i18n';

export default function App() {
  const { user, owner, profile, loading } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(
    () =>
      (localStorage.getItem('educonnect-theme') as
        | 'light'
        | 'dark') || 'light',
  );

  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('educonnect-language') as Language) || 'en',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('educonnect-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('educonnect-language', lang);
  }, [lang]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="panel" style={{ textAlign: 'center' }}>
          <strong>Loading EduConnect...</strong>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (owner) {
    return (
      <Routes>
        <Route path="/" element={<OwnerDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!profile) {
    return (
      <div className="auth-page">
        <div className="panel" style={{ maxWidth: 460 }}>
          <h2>Profile not configured</h2>
          <p>
            This authenticated account is not connected to an
            EduConnect profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      theme={theme}
      setTheme={setTheme}
      lang={lang}
      setLang={setLang}
    />
  );
}
