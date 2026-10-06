import { supabase } from './supabase';
import type {
  Profile,
  School,
  PlatformOwner,
  SchoolAdmin,
  SchoolSettings,
} from './types';

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}

export async function getMyProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function getPlatformOwner(): Promise<PlatformOwner | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('platform_owners')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as PlatformOwner | null;
}

export async function isCurrentUserOwner(): Promise<boolean> {
  const owner = await getPlatformOwner();
  return Boolean(owner);
}

export async function getMySchool(schoolId: string): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (error) throw error;
  return data as School;
}

export async function getSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as School[];
}

export async function getSchoolAdmins(): Promise<SchoolAdmin[]> {
  const { data, error } = await supabase
    .from('school_admins')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SchoolAdmin[];
}

export async function getSchoolSettings(
  schoolId: string,
): Promise<SchoolSettings | null> {
  const { data, error } = await supabase
    .from('school_settings')
    .select('*')
    .eq('school_id', schoolId)
    .maybeSingle();

  if (error) throw error;
  return data as SchoolSettings | null;
}

export async function createSchool(input: {
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  contactPhone?: string;
  contactEmail?: string;
  academicYear?: string;
  logoUrl?: string | null;
}) {
  const { data, error } = await supabase.rpc('owner_create_school', {
    p_code: input.code.trim().toUpperCase(),
    p_name: input.name.trim(),
    p_address: input.address?.trim() || null,
    p_city: input.city?.trim() || null,
    p_state: input.state?.trim() || null,
    p_contact_phone: input.contactPhone?.trim() || null,
    p_contact_email: input.contactEmail?.trim() || null,
    p_academic_year: input.academicYear?.trim() || null,
    p_logo_url: input.logoUrl || null,
  });

  if (error) throw error;
  return data;
}

export async function table<T>(
  name: string,
  options: {
    select?: string;
    limit?: number;
    order?: string;
    ascending?: boolean;
    filters?: Record<string, string | number | boolean>;
  } = {},
) {
  let query = supabase.from(name).select(options.select ?? '*');

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options.order) {
    query = query.order(options.order, {
      ascending: options.ascending ?? false,
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as T[];
}

export async function insert<T>(
  name: string,
  payload: Partial<T>,
): Promise<T> {
  const { data, error } = await supabase
    .from(name)
    .insert(payload as Record<string, unknown>)
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

export async function update<T>(
  name: string,
  id: string,
  payload: Partial<T>,
): Promise<T> {
  const { data, error } = await supabase
    .from(name)
    .update(payload as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

export async function remove(name: string, id: string) {
  const { error } = await supabase.from(name).delete().eq('id', id);
  if (error) throw error;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
}

export async function invokeStudyAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
) {
  const question = [...messages]
    .reverse()
    .find((message) => message.role === 'user')?.content;

  if (!question) {
    throw new Error('Question is required.');
  }

  const { data, error } = await supabase.functions.invoke('study-ai', {
    body: { question },
  });

  if (error) throw error;

  return data as {
    answer: string;
    model: string;
  };
  }
