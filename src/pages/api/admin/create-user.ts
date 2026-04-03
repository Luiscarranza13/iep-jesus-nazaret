import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, full_name, role } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y contraseña son requeridos' }), { status: 400 });
    }

    // Usar service role para crear usuario en auth
    const adminClient = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    // Actualizar el perfil con nombre y rol
    if (data.user) {
      await adminClient
        .from('profiles')
        .update({ full_name: full_name || null, role: role || 'editor' })
        .eq('id', data.user.id);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
