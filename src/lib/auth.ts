import { supabase } from './supabase';

async function syncAdminSessionCookie(accessToken: string) {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'No se pudo validar tu acceso al panel');
  }
}

async function clearAdminSessionCookie() {
  await fetch('/api/auth/session', {
    method: 'DELETE',
  }).catch(() => null);
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  if (!data.session?.access_token) {
    throw new Error('No se pudo crear la sesion');
  }

  try {
    await syncAdminSessionCookie(data.session.access_token);
  } catch (syncError) {
    await supabase.auth.signOut();
    throw syncError;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  await clearAdminSessionCookie();
  if (error) throw error;
}

export async function isAdmin(): Promise<boolean> {
  const result = await getCurrentUser();
  return result?.profile?.role === 'admin' || result?.profile?.role === 'editor';
}
