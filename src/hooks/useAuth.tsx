import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import {
  supabase,
  supabaseConfigured
} from '../lib/supabase';

import {
  getMyProfile,
  getMySchool
} from '../lib/api';

import type {
  Profile,
  School
} from '../lib/types';

interface AuthContextValue {
  profile: Profile | null;
  school: School | null;
  loading: boolean;
  configured: boolean;
  signIn: (
    schoolCode: string,
    phone: string,
    password: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

async function loadAuthenticatedUser() {
  let user;

  try {
    const result =
      await supabase.auth.getUser();

    user = result.data.user;

    if (result.error) {
      throw new Error(
        `AUTH_USER_QUERY_FAILED: ${result.error.message}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      'AUTH_USER_QUERY_FAILED'
    );
  }

  if (!user) {
    throw new Error(
      'AUTH_SESSION_NOT_FOUND'
    );
  }

  let profile: Profile | null;

  try {
    profile =
      await getMyProfile();
  } catch (error) {
    console.error(
      'PROFILE_QUERY_FAILED:',
      error
    );

    if (error instanceof Error) {
      throw new Error(
        `PROFILE_QUERY_FAILED: ${error.message}`
      );
    }

    throw new Error(
      'PROFILE_QUERY_FAILED'
    );
  }

  if (!profile) {
    throw new Error(
      `PROFILE_NOT_FOUND: ${user.id}`
    );
  }

  if (!profile.is_active) {
    throw new Error(
      'PROFILE_INACTIVE'
    );
  }

  let school: School;

  try {
    school =
      await getMySchool(
        profile.school_id
      );
  } catch (error) {
    console.error(
      'SCHOOL_QUERY_FAILED:',
      error
    );

    if (error instanceof Error) {
      throw new Error(
        `SCHOOL_QUERY_FAILED: ${error.message}`
      );
    }

    throw new Error(
      'SCHOOL_QUERY_FAILED'
    );
  }

  if (!school) {
    throw new Error(
      `SCHOOL_NOT_FOUND: ${profile.school_id}`
    );
  }

  return {
    profile,
    school
  };
}

export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [school, setSchool] =
    useState<School | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        if (!supabaseConfigured) {
          if (mounted) {
            setLoading(false);
          }

          return;
        }

        try {
          const {
            data: {
              session
            }
          } =
            await supabase.auth.getSession();

          if (!session) {
            if (mounted) {
              setProfile(null);
              setSchool(null);
            }

            return;
          }

          const result =
            await loadAuthenticatedUser();

          if (mounted) {
            setProfile(
              result.profile
            );

            setSchool(
              result.school
            );
          }
        } catch (error) {
          console.error(
            'SESSION_RESTORE_FAILED:',
            error
          );

          if (mounted) {
            setProfile(null);
            setSchool(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    restoreSession();

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (
            event === 'SIGNED_OUT' ||
            !session
          ) {
            setProfile(null);
            setSchool(null);
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        profile,
        school,
        loading,
        configured:
          supabaseConfigured,

        signIn: async (
          schoolCode,
          phone,
          password
        ) => {
          const code =
            schoolCode
              .trim()
              .toUpperCase();

          const cleanPhone =
            phone.trim();

          if (!code) {
            throw new Error(
              'School code is required.'
            );
          }

          if (!cleanPhone) {
            throw new Error(
              'Phone number is required.'
            );
          }

          if (!password) {
            throw new Error(
              'Password is required.'
            );
          }

          setLoading(true);

          try {
            /* STEP 1 — Resolve school + phone */
            let email: string | null =
              null;

            try {
              const {
                data,
                error
              } =
                await supabase.rpc(
                  'resolve_login_email',
                  {
                    p_code: code,
                    p_phone:
                      cleanPhone
                  }
                );

              if (error) {
                throw new Error(
                  error.message
                );
              }

              email =
                data as string | null;
            } catch (error) {
              console.error(
                'IDENTITY_RESOLUTION_FAILED:',
                error
              );

              if (
                error instanceof Error
              ) {
                throw new Error(
                  `IDENTITY_RESOLUTION_FAILED: ${error.message}`
                );
              }

              throw new Error(
                'IDENTITY_RESOLUTION_FAILED'
              );
            }

            if (!email) {
              throw new Error(
                'INVALID_SCHOOL_OR_PHONE'
              );
            }

            /* STEP 2 — Supabase password authentication */
            let authUser;

            try {
              const {
                data,
                error
              } =
                await supabase.auth
                  .signInWithPassword({
                    email,
                    password
                  });

              if (error) {
                throw new Error(
                  error.message
                );
              }

              authUser =
                data.user;
            } catch (error) {
              console.error(
                'AUTHENTICATION_FAILED:',
                error
              );

              if (
                error instanceof Error
              ) {
                throw new Error(
                  `AUTHENTICATION_FAILED: ${error.message}`
                );
              }

              throw new Error(
                'AUTHENTICATION_FAILED'
              );
            }

            if (!authUser) {
              throw new Error(
                'AUTH_SESSION_NOT_FOUND'
              );
            }

            /* STEP 3 — Load profile + school */
            const result =
              await loadAuthenticatedUser();

            setProfile(
              result.profile
            );

            setSchool(
              result.school
            );
          } catch (error) {
            console.error(
              'SIGN_IN_FAILED:',
              error
            );

            await supabase.auth
              .signOut()
              .catch(() => {});

            setProfile(null);
            setSchool(null);

            if (
              error instanceof Error
            ) {
              throw error;
            }

            throw new Error(
              'LOGIN_FAILED_UNKNOWN_ERROR'
            );
          } finally {
            setLoading(false);
          }
        },

        signOut: async () => {
          await supabase.auth.signOut();

          setProfile(null);
          setSchool(null);
        }
      }),
      [
        profile,
        school,
        loading
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const value =
    useContext(AuthContext);

  if (!value) {
    throw new Error(
      'useAuth must be inside AuthProvider'
    );
  }

  return value;
};
