import type { AstroCookies } from 'astro';
import { createServerClient } from './supabase';

export const ADMIN_AUTH_COOKIE = 'iep_admin_token';
const ADMIN_ROLES = new Set(['admin', 'editor']);

export function getAdminCookieOptions(url: URL) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: url.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearAdminAuthCookie(cookies: AstroCookies, url: URL) {
  cookies.delete(ADMIN_AUTH_COOKIE, {
    ...getAdminCookieOptions(url),
    maxAge: 0,
  });
}

export async function getAdminSessionFromToken(token: string) {
  const supabase = createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !ADMIN_ROLES.has(profile.role)) {
    return null;
  }

  return { user, profile };
}

export function extractBearerToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

export async function getAdminSessionFromRequest(request: Request, cookies?: AstroCookies) {
  const headerToken = extractBearerToken(request.headers.get('Authorization'));
  const cookieToken = cookies?.get(ADMIN_AUTH_COOKIE)?.value ?? null;
  const token = headerToken || cookieToken;

  if (!token) {
    return null;
  }

  return getAdminSessionFromToken(token);
}

export function jsonError(error: string, status = 401) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
