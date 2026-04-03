import type { APIRoute } from 'astro';
import { callGemini } from '../../lib/gemini';
import { getAdminSessionFromRequest, jsonError } from '../../lib/server-auth';
import { createServerClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const adminSession = await getAdminSessionFromRequest(request, cookies);
    if (!adminSession) {
      return jsonError('No autorizado', 401);
    }

    const body = await request.json();
    const { action, content, topic, tone, context, module } = body;

    if (!action) {
      return jsonError('Accion requerida', 400);
    }

    const result = await callGemini({ action, content, topic, tone, context });
    const supabase = createServerClient();

    await supabase.from('ai_suggestions').insert({
      user_id: adminSession.user.id,
      module: module || action,
      prompt: topic || content?.substring(0, 200) || '',
      result: result.substring(0, 2000),
    });

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('AI API error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error al procesar con IA' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
