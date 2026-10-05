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
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      'AUTH_SESSION_NOT_FOUND'
    );
  }

  const profile =
    await getMyProfile();

  if (!profile) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }

  if (!profile.is_active) {
    throw new Error(
      'PROFILE_INACTIVE'
    );
  }

  const school =
    await getMySchool(
      profile.school_id
    );

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
            'Session restore failed:',
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
            const {
              data: email,
              error:
                resolveError
            } =
              await supabase.rpc(
                'resolve_login_email',
                {
                  p_code: code,
                  p_phone:
                    cleanPhone
                }
              );

            if (resolveError) {
              console.error(
                'IDENTITY_RESOLUTION_FAILED:',
                resolveError
              );

              throw new Error(
                'IDENTITY_RESOLUTION_FAILED'
              );
            }

            if (!email) {
              throw new Error(
                'INVALID_SCHOOL_OR_PHONE'
              );
            }

            const {
              data,
              error:
                authError
            } =
              await supabase.auth
                .signInWithPassword({
                  email:
                    email as string,
                  password
                });

            if (authError) {
              console.error(
                'AUTHENTICATION_FAILED:',
                authError
              );

              throw authError;
            }

            if (!data.user) {
              throw new Error(
                'AUTH_SESSION_NOT_FOUND'
              );
            }

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
              'LOGIN_FAILED'
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
