import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UserRound,
  Users,
  X,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth';
import { Logo } from './Logo';
import { t } from '../lib/i18n';
import type { Language } from '../lib/i18n';

const common = [
  ['/', 'home', Home],
  ['/homework', 'homework', BookOpen],
  ['/attendance', 'attendance', ClipboardCheck],
  ['/exams', 'exams', CalendarDays],
  ['/results', 'results', GraduationCap],
  ['/fees', 'fees', CreditCard],
  ['/leave', 'leave', ClipboardList],
  ['/events', 'events', CalendarDays],
  ['/ptm', 'ptm', MessageSquare],
  ['/notifications', 'notifications', Bell],
  ['/notices', 'notices', FileText],
  ['/ai', 'ai', Sparkles],
  ['/profile', 'profile', UserRound],
  ['/settings', 'settings', Settings],
] as const;

const adminOnly = [
  ['/students', 'students', Users],
  ['/teachers', 'teachers', Users],
  ['/school-management', 'schoolManagement', ShieldCheck],
] as const;

export function AppShell({
  theme,
  setTheme,
  lang,
  setLang,
}: {
  theme: 'light' | 'dark';
  setTheme: (x: 'light' | 'dark') => void;
  lang: Language;
  setLang: (x: Language) => void;
}) {
  const { profile, school, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const items =
    profile?.role === 'ADMIN'
      ? [...common, ...adminOnly]
      : common;

  useEffect(() => {
    setOpen(false);
  }, [navigate]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="side-top">
          <Logo compact />

          <button
            className="icon-btn mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <div className="school-chip">
          <div className="school-dot">
            {school?.name?.slice(0, 1) ?? 'E'}
          </div>

          <div>
            <b>{school?.name ?? 'EduConnect School'}</b>
            <small>{school?.code ?? 'School'}</small>
          </div>
        </div>

        <nav>
          {items.map(([path, key, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'nav-item active'
                  : 'nav-item'
              }
            >
              <Icon size={18} />
              <span>{t(lang, key as any)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-bottom">
          <button
            className="nav-item"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            <span>
              {theme === 'dark'
                ? 'Light mode'
                : 'Dark mode'}
            </span>
          </button>

          <button
            className="nav-item"
            onClick={toggleLanguage}
          >
            <span
              style={{
                width: 18,
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              {lang === 'en' ? 'हि' : 'EN'}
            </span>

            <span>
              {lang === 'en'
                ? 'हिंदी'
                : 'English'}
            </span>
          </button>

          <button
            className="nav-item danger"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>{t(lang, 'logout')}</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="mobile-header">
          <button
            className="icon-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <Logo compact />

          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun />
            ) : (
              <Moon />
            )}
          </button>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
