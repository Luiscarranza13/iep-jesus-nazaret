import { defineMiddleware } from 'astro/middleware';
import {
  ADMIN_AUTH_COOKIE,
  clearAdminAuthCookie,
  getAdminSessionFromRequest,
  jsonError,
} from './lib/server-auth';

const LOGIN_PATH = '/admin/login';
const HOME_PATH = '/admin';
const PUBLIC_API_PATHS = new Set(['/api/contact', '/api/auth/session']);

function isProtectedApiPath(pathname: string) {
  return pathname.startsWith('/api/') && !PUBLIC_API_PATHS.has(pathname);
}

function withNoStore(response: Response) {
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminRoute = pathname.startsWith('/admin');
  const isProtectedApiRoute = isProtectedApiPath(pathname);

  if (!isAdminRoute && !isProtectedApiRoute) {
    return next();
  }

  const isLoginRoute = pathname === LOGIN_PATH;
  const adminSession = await getAdminSessionFromRequest(context.request, context.cookies);

  if (!adminSession) {
    if (context.cookies.get(ADMIN_AUTH_COOKIE)?.value) {
      clearAdminAuthCookie(context.cookies, context.url);
    }

    if (isProtectedApiRoute) {
      return withNoStore(jsonError('No autorizado', 401));
    }

    if (isLoginRoute) {
      return withNoStore(await next());
    }

    return withNoStore(context.redirect(LOGIN_PATH));
  }

  context.locals.adminUser = adminSession.user;
  context.locals.adminProfile = adminSession.profile;

  if (isLoginRoute) {
    return withNoStore(context.redirect(HOME_PATH));
  }

  return withNoStore(await next());
});
