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
    let alive = true;

    (async () => {
      if (!supabaseConfigured) {
        if (alive) {
          setLoading(false);
        }
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          const p = await getMyProfile();

          if (alive) {
            setProfile(p);

            setSchool(
              p
                ? await getMySchool(p.school_id)
                : null
            );
          }
        } catch (error) {
          console.error(
            'Failed to restore session:',
            error
          );
        }
      }

      if (alive) {
        setLoading(false);
      }
    })();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setProfile(null);
          setSchool(null);
          setLoading(false);
          return;
        }

        try {
          const p = await getMyProfile();

          setProfile(p);

          setSchool(
            p
              ? await getMySchool(p.school_id)
              : null
          );
        } catch (error) {
          console.error(
            'Failed to load profile:',
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      school,
      loading,
      configured: supabaseConfigured,

      signIn: async (
        schoolCode: string,
        phone: string,
        password: string
      ) => {
        const code =
          schoolCode.trim().toUpperCase();

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

        const {
          data: email,
          error: resolveError
        } = await supabase.rpc(
          'resolve_login_email',
          {
            p_code: code,
            p_phone: cleanPhone
          }
        );

        if (resolveError) {
          console.error(
            'Login identity error:',
            resolveError
          );

          throw new Error(
            'Unable to verify school login.'
          );
        }

        if (!email) {
          throw new Error(
            'Invalid school code or phone number.'
          );
        }

        const {
          error: authError
        } = await supabase.auth.signInWithPassword(
          {
            email: email as string,
            password
          }
        );

        if (authError) {
          throw authError;
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();

        setProfile(null);
        setSchool(null);
      }
    }),
    [profile, school, loading]
  );

  return (
    <AuthContext.Provider value={value}>
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
