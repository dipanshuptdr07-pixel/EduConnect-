import { FormEvent, useState } from 'react';
import {
  LockKeyhole,
  Mail,
  Phone,
  School as SchoolIcon,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { supabaseConfigured } from '../lib/supabase';

type LoginMode = 'school' | 'owner';

export default function Login() {
  const { signIn, signInWithLogin } = useAuth();

  const [mode, setMode] = useState<LoginMode>('school');

  const [school, setSchool] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    setBusy(true);
    setErr('');

    try {
      if (mode === 'owner') {
        await signIn(email, password);
      } else {
        await signInWithLogin(school, phone, password);
      }
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : 'Login failed. Please check your details.',
      );
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setErr('');
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="art-glow one" />
        <div className="art-glow two" />

        <Logo />

        <div className="hero-copy">
          <span className="eyebrow">
            SAFE · SIMPLE · SMART
          </span>

          <h1>
            One connected platform for every school.
          </h1>

          <p>
            Attendance, academics, communication and school
            operations — designed around the real daily workflow.
          </p>

          <div className="trust">
            <ShieldCheck />
            Secure multi-school architecture
          </div>
        </div>
      </div>

      <div className="auth-card-wrap">
        <form className="auth-card" onSubmit={submit}>
          <Logo />

          <h2>
            {mode === 'owner'
              ? 'Platform Owner'
              : 'Welcome back'}
          </h2>

          <p>
            {mode === 'owner'
              ? 'Sign in to manage EduConnect schools.'
              : 'Sign in to your EduConnect school account.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              margin: '18px 0',
              padding: 4,
              borderRadius: 12,
              background: 'var(--muted, #f3f4f6)',
            }}
          >
            <button
              type="button"
              onClick={() => switchMode('school')}
              style={{
                border: 0,
                borderRadius: 9,
                padding: '10px 8px',
                cursor: 'pointer',
                fontWeight: 750,
                background:
                  mode === 'school'
                    ? 'var(--card, #fff)'
                    : 'transparent',
                boxShadow:
                  mode === 'school'
                    ? '0 1px 4px rgba(0,0,0,.08)'
                    : 'none',
              }}
            >
              School Login
            </button>

            <button
              type="button"
              onClick={() => switchMode('owner')}
              style={{
                border: 0,
                borderRadius: 9,
                padding: '10px 8px',
                cursor: 'pointer',
                fontWeight: 750,
                background:
                  mode === 'owner'
                    ? 'var(--card, #fff)'
                    : 'transparent',
                boxShadow:
                  mode === 'owner'
                    ? '0 1px 4px rgba(0,0,0,.08)'
                    : 'none',
              }}
            >
              Owner Login
            </button>
          </div>

          {mode === 'school' ? (
            <>
              <label>
                School Code

                <div className="field">
                  <SchoolIcon />

                  <input
                    value={school}
                    onChange={(event) =>
                      setSchool(
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="EDU001"
                    autoComplete="organization"
                    required
                  />
                </div>
              </label>

              <label>
                Phone Number

                <div className="field">
                  <Phone />

                  <input
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    inputMode="tel"
                    placeholder="9876543210"
                    autoComplete="tel"
                    required
                  />
                </div>
              </label>
            </>
          ) : (
            <label>
              Owner Email

              <div className="field">
                <Mail />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="owner@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>
          )}

          <label>
            Password

            <div className="field">
              <LockKeyhole />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          {err && (
            <div className="form-error">
              {err}
            </div>
          )}

          {!supabaseConfigured && (
            <div className="setup-note">
              <b>Supabase is not configured.</b>

              <span>
                Add the required environment values to enable
                real authentication.
              </span>
            </div>
          )}

          <button
            className="primary full"
            disabled={busy || !supabaseConfigured}
          >
            {busy
              ? 'Signing in…'
              : mode === 'owner'
                ? 'Sign in as Owner'
                : 'Sign in securely'}
          </button>

          <small className="auth-foot">
            {mode === 'owner'
              ? 'Platform-level Owner access'
              : 'Student · Teacher · Admin'}
          </small>
        </form>
      </div>
    </div>
  );
           }
