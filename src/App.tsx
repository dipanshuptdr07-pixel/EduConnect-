import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import Dashboard from './pages/Dashboard';

export default function App() {
  const {
    user,
    owner,
    profile,
    loading,
    signOut,
  } = useAuth();

  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!user) {
      setAuthError('');
    }
  }, [user]);

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
        <div
          style={{
            textAlign: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '4px solid #dbeafe',
              borderTopColor: '#2563eb',
              animation: 'educonnect-spin 0.8s linear infinite',
              margin: '0 auto 14px',
            }}
          />

          <div style={{ fontWeight: 800 }}>
            Loading EduConnect...
          </div>
        </div>

        <style>
          {`
            @keyframes educonnect-spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (owner) {
    return <OwnerDashboard />;
  }

  if (profile) {
    return <Dashboard />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--background, #f6f8fc)',
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: '100%',
          padding: 28,
          borderRadius: 20,
          background: 'var(--card, #fff)',
          border: '1px solid var(--border, #e5e7eb)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Account Setup Required
        </h2>

        <p
          style={{
            color: 'var(--muted-foreground, #6b7280)',
            lineHeight: 1.6,
          }}
        >
          Your authentication account exists, but no EduConnect
          profile is connected to it yet.
        </p>

        {authError && (
          <p style={{ color: '#b91c1c' }}>
            {authError}
          </p>
        )}

        <button
          type="button"
          onClick={async () => {
            try {
              setAuthError('');
              await signOut();
            } catch (error: any) {
              setAuthError(
                error?.message || 'Could not sign out.',
              );
            }
          }}
          style={{
            border: 0,
            borderRadius: 10,
            padding: '11px 18px',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
