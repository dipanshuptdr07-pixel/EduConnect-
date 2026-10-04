import { supabase } from './supabase';
import type { Profile, School } from './types';

export async function getMyProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();

  if (error) throw error;

  return data as Profile;
}

export async function getMySchool(
  schoolId: string
): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (error) throw error;

  return data as School;
}

export async function table<T>(
  name: string,
  options: {
    select?: string;
    limit?: number;
    order?: string;
    ascending?: boolean;
  } = {}
) {
  let query = supabase
    .from(name)
    .select(options.select ?? '*');

  if (options.order) {
    query = query.order(options.order, {
      ascending: options.ascending ?? false
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
  payload: Partial<T>
) {
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
  payload: Partial<T>
) {
  const { data, error } = await supabase
    .from(name)
    .update(payload as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data as T;
}

export async function remove(
  name: string,
  id: string
) {
  const { error } = await supabase
    .from(name)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function markNotificationRead(
  id: string
) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) throw error;
}

export async function invokeStudyAI(
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[]
) {
  const question = [...messages]
    .reverse()
    .find(
      (message) => message.role === 'user'
    )?.content;

  if (!question) {
    throw new Error('Question is required.');
  }

  const { data, error } =
    await supabase.functions.invoke('study-ai', {
      body: { question }
    });

  if (error) throw error;

  return data as {
    answer: string;
    model: string;
  };
}
