import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return new Response(JSON.stringify({ error: 'Archivo y userId requeridos' }), { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'La imagen supera los 2 MB' }), { status: 400 });
    }

    const adminClient = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `avatar-${userId}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: upErr } = await adminClient.storage
      .from('blog-images')
      .upload(path, buffer, { upsert: true, contentType: file.type });

    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });
    }

    const { data: { publicUrl } } = adminClient.storage.from('blog-images').getPublicUrl(path);

    return new Response(JSON.stringify({ publicUrl }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
