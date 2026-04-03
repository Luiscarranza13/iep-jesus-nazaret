import type { APIRoute } from 'astro';
import {
  ADMIN_AUTH_COOKIE,
  clearAdminAuthCookie,
  getAdminCookieOptions,
  getAdminSessionFromToken,
} from '../../../lib/server-auth';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'No autorizado' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const session = await getAdminSessionFromToken(token);

  if (!session) {
    clearAdminAuthCookie(cookies, url);
    return json({ error: 'Tu usuario no tiene acceso al panel administrativo' }, 403);
  }

  cookies.set(ADMIN_AUTH_COOKIE, token, getAdminCookieOptions(url));

  return json({
    ok: true,
    role: session.profile.role,
    name: session.profile.full_name || session.user.email || 'Administrador',
  });
};

export const DELETE: APIRoute = async ({ cookies, url }) => {
  clearAdminAuthCookie(cookies, url);
  return json({ ok: true });
};
