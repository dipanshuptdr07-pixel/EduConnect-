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
  const {
    user,
    owner,
    profile,
    loading,
  } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(
    () =>
      (localStorage.getItem('educonnect-theme') as
        | 'light'
        | 'dark') || 'light',
  );

  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('educonnect-language') as Language) ||
      'en',
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
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--background, #f6f8fc)',
        }}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '4px solid #dbeafe',
              borderTopColor: '#2563eb',
              animation:
                'educonnect-spin .8s linear infinite',
              margin: '0 auto 14px',
            }}
          />

          <strong>Loading EduConnect...</strong>
        </div>

        <style>
          {`
            @keyframes educonnect-spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
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
        <Route
          path="/"
          element={<OwnerDashboard />}
        />
        <Route
          path="/owner"
          element={<OwnerDashboard />}
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    );
  }

  if (!profile) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                padding: 24,
              }}
            >
              <div
                style={{
                  maxWidth: 420,
                  width: '100%',
                  padding: 28,
                  borderRadius: 20,
                  background: 'var(--card, #fff)',
                  border:
                    '1px solid var(--border, #e5e7eb)',
                  textAlign: 'center',
                }}
              >
                <h2>Profile not configured</h2>
                <p>
                  This account is authenticated but is not
                  connected to an EduConnect profile.
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    );
  }

  return (
    <AppShell
      theme={theme}
      setTheme={setTheme}
      lang={lang}
      setLang={setLang}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/homework" element={<Homework />} />
        <Route path="/attendance" element={<Attendance />} />

        <Route
          path="/exams"
          element={<GenericModule kind="exams" />}
        />

        <Route
          path="/results"
          element={<GenericModule kind="results" />}
        />

        <Route
          path="/fees"
          element={<GenericModule kind="fees" />}
        />

        <Route path="/leave" element={<Leave />} />

        <Route
          path="/events"
          element={<GenericModule kind="events" />}
        />

        <Route
          path="/ptm"
          element={<GenericModule kind="ptm" />}
        />

        <Route
          path="/notifications"
          element={<GenericModule kind="notifications" />}
        />

        <Route
          path="/notices"
          element={<GenericModule kind="notices" />}
        />

        <Route path="/ai" element={<AI />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {profile.role === 'ADMIN' && (
          <>
            <Route
              path="/students"
              element={<Roster kind="students" />}
            />

            <Route
              path="/teachers"
              element={<Roster kind="teachers" />}
            />

            <Route
              path="/school-management"
              element={<SchoolManagement />}
            />
          </>
        )}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </AppShell>
  );
}
