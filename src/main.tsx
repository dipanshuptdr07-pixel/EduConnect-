import ReactDOM from 'react-dom/client';
import {
  HashRouter,
  Navigate,
  Route,
  Routes
} from 'react-router-dom';
import { useEffect, useState } from 'react';

import {
  AuthProvider,
  useAuth
} from './hooks/useAuth';

import { AppShell } from './components/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GenericModule from './pages/GenericModule';
import Homework from './pages/Homework';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Roster from './pages/Roster';
import AI from './pages/AI';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import SchoolManagement from './pages/SchoolManagement';

import './styles/global.css';

import type { Language } from './lib/i18n';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(console.error);
  });
}

function Protected() {
  const { profile, loading } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(
    () =>
      (localStorage.getItem(
        'educonnect_theme'
      ) as 'light' | 'dark') || 'light'
  );

  const [lang, setLang] = useState<Language>(
    () =>
      (localStorage.getItem(
        'educonnect_lang'
      ) as Language) || 'en'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('educonnect_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('educonnect_lang', lang);
  }, [lang]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">E</div>
        <span>Loading EduConnect…</span>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
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

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route element={<Protected />}>
            <Route
              index
              element={<Dashboard />}
            />

            <Route
              path="homework"
              element={<Homework />}
            />

            <Route
              path="attendance"
              element={<Attendance />}
            />

            <Route
              path="exams"
              element={<GenericModule kind="exams" />}
            />

            <Route
              path="results"
              element={<GenericModule kind="results" />}
            />

            <Route
              path="fees"
              element={<GenericModule kind="fees" />}
            />

            <Route
              path="leave"
              element={<Leave />}
            />

            <Route
              path="events"
              element={<GenericModule kind="events" />}
            />

            <Route
              path="ptm"
              element={<GenericModule kind="ptm" />}
            />

            <Route
              path="notifications"
              element={
                <GenericModule kind="notifications" />
              }
            />

            <Route
              path="notices"
              element={<GenericModule kind="notices" />}
            />

            <Route
              path="students"
              element={<Roster kind="students" />}
            />

            <Route
              path="teachers"
              element={<Roster kind="teachers" />}
            />

            <Route
              path="school-management"
              element={<SchoolManagement />}
            />

            <Route
              path="ai"
              element={<AI />}
            />

            <Route
              path="profile"
              element={<Profile />}
            />

            <Route
              path="settings"
              element={<Settings />}
            />
          </Route>

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(
  document.getElementById('root')!
).render(<App />);
