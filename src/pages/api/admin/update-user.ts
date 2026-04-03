import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, full_name, role, avatar_url } = await request.json();

    if (!id) {
      return json({ error: 'El id del usuario es requerido' }, 400);
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return json({ error: 'Rol no válido' }, 400);
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name?.trim() || null,
        role,
        avatar_url: avatar_url || null,
      })
      .eq('id', id)
      .select('id, full_name, role, avatar_url')
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ ok: true, user: data });
  } catch (err: any) {
    return json({ error: err?.message ?? 'No se pudo actualizar el usuario' }, 500);
  }
};
