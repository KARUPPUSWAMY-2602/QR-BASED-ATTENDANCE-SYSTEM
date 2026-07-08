import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, role: Profile['role'], extraData?: Record<string, unknown>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile(data ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => { await fetchProfile(s.user.id); })();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      (async () => {
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
        if (event === 'INITIAL_SESSION') setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    name: string,
    role: Profile['role'],
    extraData?: Record<string, unknown>
  ) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up failed' };

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: name,
      role,
    });
    if (profileErr) return { error: profileErr.message };

    if (role === 'student' && extraData) {
      const { error: studentErr } = await supabase.from('students').insert({
        id: data.user.id,
        reg_no: extraData.reg_no as string,
        course: extraData.course as string,
        section: extraData.section as string,
        semester: extraData.semester as number,
        department: extraData.department as string,
      });
      if (studentErr) return { error: studentErr.message };
    }

    if (role === 'faculty' && extraData) {
      const { error: facultyErr } = await supabase.from('faculty').insert({
        id: data.user.id,
        employee_id: extraData.employee_id as string,
        department: extraData.department as string,
        designation: extraData.designation as string,
      });
      if (facultyErr) return { error: facultyErr.message };
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
