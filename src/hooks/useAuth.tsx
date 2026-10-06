import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  getMyProfile,
  getMySchool,
  getPlatformOwner,
} from '../lib/api';
import type { Profile, School, PlatformOwner, Role } from '../lib/types';

interface AuthContextValue {
  user: any | null;
  profile: Profile | null;
  owner: PlatformOwner | null;
  school: School | null;
  role: Role | null;
  isOwner: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithLogin: (
    schoolCode: string,
    phone: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [owner, setOwner] = useState<PlatformOwner | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const clearState = () => {
    setUser(null);
    setProfile(null);
    setOwner(null);
    setSchool(null);
  };

  const loadIdentity = async (currentUser: any | null) => {
    if (!currentUser) {
      clearState();
      return;
    }

    setUser(currentUser);

    try {
      const platformOwner = await getPlatformOwner();

      if (platformOwner) {
        setOwner(platformOwner);
        setProfile(null);
        setSchool(null);
        return;
      }

      const currentProfile = await getMyProfile();

      if (!currentProfile) {
        setProfile(null);
        setSchool(null);
        setOwner(null);
        return;
      }

      setOwner(null);
      setProfile(currentProfile);

      if (currentProfile.school_id) {
        try {
          const currentSchool = await getMySchool(currentProfile.school_id);
          setSchool(currentSchool);
        } catch {
          setSchool(null);
        }
      } else {
        setSchool(null);
      }
    } catch (error) {
      console.error('Failed to load identity:', error);
      setProfile(null);
      setOwner(null);
      setSchool(null);
    }
  };

  const refresh = async () => {
    setLoading(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      await loadIdentity(currentUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          await loadIdentity(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialisation failed:', error);

        if (mounted) {
          clearState();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialise();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      await loadIdentity(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error('Email and password are required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;

    await loadIdentity(data.user);
  };

  const signInWithLogin = async (
    schoolCode: string,
    phone: string,
    password: string,
  ) => {
    const code = schoolCode.trim().toUpperCase();
    const cleanPhone = phone.trim();

    if (!code || !cleanPhone || !password) {
      throw new Error('School Code, phone number and password are required.');
    }

    const { data: resolvedEmail, error: resolverError } =
      await supabase.rpc('resolve_login_email', {
        p_code: code,
        p_phone: cleanPhone,
      });

    if (resolverError) {
      throw resolverError;
    }

    if (!resolvedEmail) {
      throw new Error(
        'No active account found for this School Code and phone number.',
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error) throw error;

    await loadIdentity(data.user);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    clearState();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      owner,
      school,
      role: profile?.role ?? null,
      isOwner: Boolean(owner),
      loading,
      signIn,
      signInWithLogin,
      signOut,
      refresh,
    }),
    [user, profile, owner, school, loading],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
                                        }
