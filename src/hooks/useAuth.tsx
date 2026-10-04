import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, supabaseConfigured, normalizePhone } from '../lib/supabase';
import { getMyProfile, getMySchool } from '../lib/api';
import type { Profile, School } from '../lib/types';

interface AuthContextValue { profile: Profile | null; school: School | null; loading: boolean; configured: boolean; signIn: (schoolCode: string, phone: string, password: string) => Promise<void>; signOut: () => Promise<void>; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile,setProfile]=useState<Profile|null>(null); const [school,setSchool]=useState<School|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ let alive=true; (async()=>{ if(!supabaseConfigured){ if(alive)setLoading(false); return; } const {data:{session}}=await supabase.auth.getSession(); if(session?.user){ try { const p=await getMyProfile(); if(alive){setProfile(p); setSchool(p?await getMySchool(p.school_id):null);} } catch(e){ console.error(e); } } if(alive)setLoading(false); })(); const {data:{subscription}}=supabase.auth.onAuthStateChange(async(_event,session)=>{ if(!session){setProfile(null);setSchool(null);setLoading(false);return;} try {const p=await getMyProfile(); setProfile(p); setSchool(p?await getMySchool(p.school_id):null);} catch(e){console.error(e);} finally {setLoading(false);} }); return()=>{alive=false;subscription.unsubscribe();}; },[]);
  const value=useMemo(()=>({profile,school,loading,configured:supabaseConfigured,signIn:async(schoolCode,phone,password)=>{const {data,error}=await supabase.rpc('resolve_school_code',{p_code:schoolCode.toUpperCase()}); if(error||!data) throw new Error('Invalid school code.'); const {error:authError}=await supabase.auth.signInWithPassword({phone:normalizePhone(phone),password}); if(authError) throw authError;},signOut:async()=>{await supabase.auth.signOut();setProfile(null);setSchool(null);}}),[profile,school,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>{const v=useContext(AuthContext);if(!v)throw new Error('useAuth must be inside AuthProvider');return v;};
