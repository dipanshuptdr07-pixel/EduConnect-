import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createSchool, getSchools } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { School } from '../lib/types';
import { Modal } from '../components/Modal';

type SchoolForm = {
  name: string;
  address: string;
  city: string;
  state: string;
  contactPhone: string;
  contactEmail: string;
  academicYear: string;
  status: string;
};

const emptyForm: SchoolForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  contactPhone: '',
  contactEmail: '',
  academicYear: '2026-27',
  status: 'ACTIVE',
};

export default function OwnerDashboard() {
  const { owner, signOut } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSchool, setShowAddSchool] = useState(false);

  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editForm, setEditForm] = useState<SchoolForm>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);

  const [error, setError] = useState('');

  const [addForm, setAddForm] = useState({
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

    if (!addForm.code.trim() || !addForm.name.trim()) {
      setError('School Code and School Name are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await createSchool(addForm);

      setAddForm({
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

  const openEdit = (school: School) => {
    setEditingSchool(school);

    setEditForm({
      name: school.name ?? '',
      address: school.address ?? '',
      city: school.city ?? '',
      state: school.state ?? '',
      contactPhone: school.contact_phone ?? '',
      contactEmail: school.contact_email ?? '',
      academicYear: school.academic_year ?? '',
      status: (school.status || 'ACTIVE').toUpperCase(),
    });

    setError('');
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingSchool) return;

    if (!editForm.name.trim()) {
      setError('School Name is required.');
      return;
    }

    try {
      setEditSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('schools')
        .update({
          name: editForm.name.trim(),
          address: editForm.address.trim() || null,
          city: editForm.city.trim() || null,
          state: editForm.state.trim() || null,
          contact_phone: editForm.contactPhone.trim() || null,
          contact_email: editForm.contactEmail.trim() || null,
          academic_year: editForm.academicYear.trim() || null,
          status: editForm.status,
        })
        .eq('id', editingSchool.id);

      if (updateError) {
        throw updateError;
      }

      setEditingSchool(null);

      await loadSchools();
    } catch (err: any) {
      setError(err?.message || 'Could not update school.');
    } finally {
      setEditSaving(false);
    }
  };

  const activeSchools = schools.filter(
    (school) =>
      (school.status || 'ACTIVE').toUpperCase() === 'ACTIVE',
  ).length;

  const suspendedSchools = schools.filter(
    (school) =>
      (school.status || '').toUpperCase() === 'SUSPENDED',
  ).length;

  if (!owner) {
    return (
      <div className="auth-page">
        <div
          className="panel"
          style={{
            maxWidth: 420,
            margin: '40px auto',
            textAlign: 'center',
            padding: 24,
          }}
        >
          <h2>Owner Access Required</h2>

          <p className="muted">
            Please sign in with the platform owner account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background, #f6f8fc)',
      }}
    >
      {/* HEADER */}

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderBottom:
            '1px solid var(--border, #e5e7eb)',
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
                fontWeight: 800,
                color: '#2563eb',
              }}
            >
              EDUCONNECT
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 850,
              }}
            >
              Platform Owner
            </div>
          </div>

          <button
            className="secondary"
            type="button"
            onClick={signOut}
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 16px 48px',
        }}
      >
        {/* WELCOME */}

        <section style={{ marginBottom: 24 }}>
          <div className="muted">
            Welcome back
          </div>

          <h1
            style={{
              margin: '4px 0 0',
              fontSize: 'clamp(26px, 5vw, 38px)',
            }}
          >
            {owner.full_name}
          </h1>

          <p className="muted">
            Manage all EduConnect schools from one place.
          </p>
        </section>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom: 18,
              padding: 13,
              borderRadius: 10,
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {/* STATS */}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 14,
            marginBottom: 24,
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

        {/* SCHOOLS */}

        <section
          className="panel"
          style={{
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 18,
              borderBottom:
                '1px solid var(--border, #e5e7eb)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>
                Schools
              </h2>

              <p
                className="muted"
                style={{
                  margin: '5px 0 0',
                  fontSize: 13,
                }}
              >
                View and manage school tenants.
              </p>
            </div>

            <button
              className="primary"
              type="button"
              onClick={() => {
                setError('');
                setShowAddSchool((value) => !value);
              }}
            >
              + Add New School
            </button>
          </div>

          {/* ADD SCHOOL FORM */}

          {showAddSchool && (
            <form
              onSubmit={submitSchool}
              style={{
                padding: 18,
                borderBottom:
                  '1px solid var(--border, #e5e7eb)',
                background:
                  'var(--background, #f8fafc)',
              }}
            >
              <div className="form-grid">
                <Field
                  label="School Code *"
                  value={addForm.code}
                  placeholder="EDU002"
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      code: value.toUpperCase(),
                    })
                  }
                />

                <Field
                  label="School Name *"
                  value={addForm.name}
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      name: value,
                    })
                  }
                />

                <Field
                  label="Address"
                  value={addForm.address}
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      address: value,
                    })
                  }
                />

                <Field
                  label="City"
                  value={addForm.city}
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      city: value,
                    })
                  }
                />

                <Field
                  label="State"
                  value={addForm.state}
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      state: value,
                    })
                  }
                />

                <Field
                  label="Contact Phone"
                  value={addForm.contactPhone}
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      contactPhone: value,
                    })
                  }
                />

                <Field
                  label="Contact Email"
                  type="email"
                  value={addForm.contactEmail}
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      contactEmail: value,
                    })
                  }
                />

                <Field
                  label="Academic Year"
                  value={addForm.academicYear}
                  onChange={(value) =>
                    setAddForm({
                      ...addForm,
                      academicYear: value,
                    })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={() =>
                    setShowAddSchool(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Creating...'
                    : 'Create School'}
                </button>
              </div>
            </form>
          )}

          {/* SCHOOL LIST */}

          {loading ? (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
              }}
            >
              Loading schools...
            </div>
          ) : schools.length === 0 ? (
            <div
              className="muted"
              style={{
                padding: 40,
                textAlign: 'center',
              }}
            >
              No schools found.
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 520,
                }}
              >
                <thead>
                  <tr>
                    <Th>School</Th>
                    <Th>Code</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {schools.map((school) => (
                    <tr key={school.id}>
                      <Td>
                        <strong>
                          {school.name}
                        </strong>

                        <div
                          className="muted"
                          style={{
                            fontSize: 12,
                            marginTop: 3,
                          }}
                        >
                          {[school.city, school.state]
                            .filter(Boolean)
                            .join(', ') || 'Location not set'}
                        </div>
                      </Td>

                      <Td>
                        <strong
                          style={{
                            color: '#2563eb',
                          }}
                        >
                          {school.code}
                        </strong>
                      </Td>

                      <Td>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '5px 9px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            background:
                              school.status ===
                              'SUSPENDED'
                                ? '#fee2e2'
                                : '#dcfce7',
                            color:
                              school.status ===
                              'SUSPENDED'
                                ? '#b91c1c'
                                : '#166534',
                          }}
                        >
                          {school.status ||
                            'ACTIVE'}
                        </span>
                      </Td>

                      <Td>
                        <button
                          className="secondary small"
                          type="button"
                          onClick={() =>
                            openEdit(school)
                          }
                        >
                          Edit
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* EDIT SCHOOL MODAL */}

      <Modal
        open={Boolean(editingSchool)}
        title={
          editingSchool
            ? `Edit ${editingSchool.name}`
            : 'Edit School'
        }
        onClose={() =>
          !editSaving &&
          setEditingSchool(null)
        }
      >
        <form onSubmit={saveEdit}>
          <div
            className="form-grid"
            style={{ padding: 18 }}
          >
            <Field
              label="School Code"
              value={editingSchool?.code ?? ''}
              disabled
              onChange={() => {}}
            />

            <Field
              label="School Name *"
              value={editForm.name}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  name: value,
                })
              }
            />

            <Field
              label="Address"
              value={editForm.address}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  address: value,
                })
              }
            />

            <Field
              label="City"
              value={editForm.city}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  city: value,
                })
              }
            />

            <Field
              label="State"
              value={editForm.state}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  state: value,
                })
              }
            />

            <Field
              label="Contact Phone"
              value={editForm.contactPhone}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  contactPhone: value,
                })
              }
            />

            <Field
              label="Contact Email"
              type="email"
              value={editForm.contactEmail}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  contactEmail: value,
                })
              }
            />

            <Field
              label="Academic Year"
              value={editForm.academicYear}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  academicYear: value,
                })
              }
            />

            <label>
              Status

              <select
                value={editForm.status}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    status:
                      event.target.value,
                  })
                }
              >
                <option value="ACTIVE">
                  Active
                </option>

                <option value="SUSPENDED">
                  Suspended
                </option>
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button
              className="secondary"
              type="button"
              disabled={editSaving}
              onClick={() =>
                setEditingSchool(null)
              }
            >
              Cancel
            </button>

            <button
              className="primary"
              type="submit"
              disabled={editSaving}
            >
              {editSaving
                ? 'Saving...'
                : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

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
      className="panel"
      style={{
        padding: 18,
      }}
    >
      <div
        className="muted"
        style={{
          fontSize: 13,
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
        className="muted"
        style={{
          fontSize: 12,
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
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '12px 14px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: '14px',
        verticalAlign: 'middle',
        borderTop:
          '1px solid var(--border, #e5e7eb)',
      }}
    >
      {children}
    </td>
  );
}