import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceKey  = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const formData = await request.formData();
    const file     = formData.get('file');
    const userId   = String(formData.get('userId') ?? 'unknown');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No se recibió archivo válido' }), { status: 400 });
    }

    const blob = file as File;

    if (blob.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'La imagen supera los 2 MB' }), { status: 400 });
    }

    const ext      = (blob.name.split('.').pop() ?? 'jpg').toLowerCase();
    const fileName = `avatar-${userId}-${Date.now()}.${ext}`;
    const bucket   = 'blog-images';

    // Usar fetch directo — probado y funciona con sb_secret_ keys
    const bytes = await blob.arrayBuffer();

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': blob.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: bytes,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return new Response(JSON.stringify({ error: `Storage: ${errText}` }), { status: 500 });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
    return new Response(JSON.stringify({ publicUrl }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500 });
  }
};
