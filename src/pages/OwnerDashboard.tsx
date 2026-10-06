import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createSchool, getSchools } from '../lib/api';
import type { School } from '../lib/types';

export default function OwnerDashboard() {
  const { owner, signOut } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    state: '',
    contactPhone: '',
    contactEmail: '',
    academicYear: '2026-27',
  });

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSchools();
      setSchools(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load schools.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const submitSchool = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.code.trim() || !form.name.trim()) {
      setError('School Code and School Name are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await createSchool({
        code: form.code,
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        academicYear: form.academicYear,
      });

      setForm({
        code: '',
        name: '',
        address: '',
        city: '',
        state: '',
        contactPhone: '',
        contactEmail: '',
        academicYear: '2026-27',
      });

      setShowAddSchool(false);
      await loadSchools();
    } catch (err: any) {
      setError(err?.message || 'Could not create school.');
    } finally {
      setSaving(false);
    }
  };

  const activeSchools = schools.filter(
    (school) => (school.status || 'ACTIVE').toUpperCase() === 'ACTIVE',
  ).length;

  const suspendedSchools = schools.filter(
    (school) => (school.status || '').toUpperCase() === 'SUSPENDED',
  ).length;

  if (!owner) {
    return (
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
            border: '1px solid var(--border, #e5e7eb)',
            background: 'var(--card, #fff)',
            textAlign: 'center',
          }}
        >
          <h2>Owner Access Required</h2>
          <p>Please sign in with the platform owner account.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background, #f6f8fc)',
        color: 'var(--foreground, #111827)',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderBottom: '1px solid var(--border, #e5e7eb)',
          background: 'var(--card, #fff)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#2563eb',
                letterSpacing: 0.5,
              }}
            >
              EDUCONNECT
            </div>

            <div style={{ fontSize: 20, fontWeight: 800 }}>
              Platform Owner
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            style={{
              border: '1px solid var(--border, #e5e7eb)',
              background: 'transparent',
              borderRadius: 10,
              padding: '9px 14px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 20px 48px',
        }}
      >
        <section style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 14,
              color: 'var(--muted-foreground, #6b7280)',
              marginBottom: 4,
            }}
          >
            Welcome back
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(26px, 5vw, 38px)',
              fontWeight: 850,
            }}
          >
            {owner.full_name}
          </h1>

          <p
            style={{
              marginTop: 8,
              color: 'var(--muted-foreground, #6b7280)',
            }}
          >
            Manage all EduConnect schools from one place.
          </p>
        </section>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 12,
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          <Stat
            title="Total Schools"
            value={schools.length}
            subtitle="All registered schools"
          />

          <Stat
            title="Active Schools"
            value={activeSchools}
            subtitle="Currently active"
          />

          <Stat
            title="Suspended"
            value={suspendedSchools}
            subtitle="Temporarily suspended"
          />
        </section>

        <section
          style={{
            borderRadius: 20,
            border: '1px solid var(--border, #e5e7eb)',
            background: 'var(--card, #fff)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 18,
              borderBottom: '1px solid var(--border, #e5e7eb)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                Schools
              </h2>

              <p
                style={{
                  margin: '5px 0 0',
                  fontSize: 13,
                  color: 'var(--muted-foreground, #6b7280)',
                }}
              >
                Create and manage school tenants.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError('');
                setShowAddSchool((value) => !value);
              }}
              style={{
                border: 0,
                background: '#2563eb',
                color: '#fff',
                borderRadius: 11,
                padding: '11px 16px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              + Add New School
            </button>
          </div>

          {showAddSchool && (
            <form
              onSubmit={submitSchool}
              style={{
                padding: 18,
                borderBottom: '1px solid var(--border, #e5e7eb)',
                background: 'var(--background, #f8fafc)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                }}
              >
                <Field
                  label="School Code *"
                  value={form.code}
                  placeholder="EDU002"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      code: value.toUpperCase(),
                    }))
                  }
                />

                <Field
                  label="School Name *"
                  value={form.name}
                  placeholder="ABC Public School"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      name: value,
                    }))
                  }
                />

                <Field
                  label="Address"
                  value={form.address}
                  placeholder="School address"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      address: value,
                    }))
                  }
                />

                <Field
                  label="City"
                  value={form.city}
                  placeholder="Indore"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      city: value,
                    }))
                  }
                />

                <Field
                  label="State"
                  value={form.state}
                  placeholder="Madhya Pradesh"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      state: value,
                    }))
                  }
                />

                <Field
                  label="Contact Phone"
                  value={form.contactPhone}
                  placeholder="+91..."
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      contactPhone: value,
                    }))
                  }
                />

                <Field
                  label="Contact Email"
                  value={form.contactEmail}
                  placeholder="school@example.com"
                  type="email"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      contactEmail: value,
                    }))
                  }
                />

                <Field
                  label="Academic Year"
                  value={form.academicYear}
                  placeholder="2026-27"
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      academicYear: value,
                    }))
                  }
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 18,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddSchool(false)}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'transparent',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '11px 18px',
                    borderRadius: 10,
                    border: 0,
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Creating...' : 'Create School'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center' }}>
              Loading schools...
            </div>
          ) : schools.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--muted-foreground, #6b7280)',
              }}
            >
              No schools found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 650,
                }}
              >
                <thead>
                  <tr>
                    <Th>School</Th>
                    <Th>Code</Th>
                    <Th>Location</Th>
                    <Th>Academic Year</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>

                <tbody>
                  {schools.map((school) => (
                    <tr key={school.id}>
                      <Td>
                        <strong>{school.name}</strong>
                      </Td>

                      <Td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: '#2563eb',
                          }}
                        >
                          {school.code}
                        </span>
                      </Td>

                      <Td>
                        {[school.city, school.state]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </Td>

                      <Td>{school.academic_year || '—'}</Td>

                      <Td>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '5px 9px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            background:
                              (school.status || 'ACTIVE') === 'ACTIVE'
                                ? '#dcfce7'
                                : '#fee2e2',
                            color:
                              (school.status || 'ACTIVE') === 'ACTIVE'
                                ? '#166534'
                                : '#991b1b',
                          }}
                        >
                          {school.status || 'ACTIVE'}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 18,
        border: '1px solid var(--border, #e5e7eb)',
        background: 'var(--card, #fff)',
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: 'var(--muted-foreground, #6b7280)',
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 850,
          marginTop: 7,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'var(--muted-foreground, #6b7280)',
          marginTop: 3,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 750,
          marginBottom: 6,
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '11px 12px',
          borderRadius: 10,
          border: '1px solid var(--border, #d1d5db)',
          background: 'var(--card, #fff)',
          color: 'inherit',
          outline: 'none',
        }}
      />
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '12px 14px',
        fontSize: 12,
        color: 'var(--muted-foreground, #6b7280)',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: '14px',
        fontSize: 14,
        borderBottom: '1px solid var(--border, #e5e7eb)',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
  }
