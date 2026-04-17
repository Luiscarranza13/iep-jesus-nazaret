import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';
import { getAdminSessionFromRequest, jsonError } from '../../../lib/server-auth';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const adminSession = await getAdminSessionFromRequest(request, cookies);

    if (!adminSession) {
      return jsonError('No autorizado', 401);
    }

    const { profile } = adminSession;
    return json({ profile });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Error al obtener perfil' }, 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const adminSession = await getAdminSessionFromRequest(request, cookies);

    if (!adminSession) {
      return jsonError('No autorizado', 401);
    }

    const { full_name, avatar_url } = await request.json();
    const supabase = createServerClient();
    const { user } = adminSession;

    const { data, error } = await (supabase as any)
      .from('profiles')
      .update({
        full_name: full_name?.trim() || null,
        avatar_url: avatar_url || null,
      })
      .eq('id', user.id)
      .select('id, full_name, email, role, avatar_url')
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ ok: true, profile: data });
  } catch (err: any) {
    return json({ error: err?.message ?? 'No se pudo actualizar el perfil' }, 500);
  }
};