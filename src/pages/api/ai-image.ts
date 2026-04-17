import type { APIRoute } from 'astro';
import { getAdminSessionFromRequest, jsonError } from '../../lib/server-auth';
import { createServerClient } from '../../lib/supabase';

const ALLOWED_BUCKETS = new Set(['blog-images', 'gallery-images', 'hero-images', 'logos', 'avatars']);
const REQUEST_HEADERS = {
  Accept: 'application/json, image/*',
  'User-Agent': 'IEP-Jesus-de-Nazaret/1.0',
};

type ImageSource = 'pollinations' | 'wikimedia' | 'openverse' | 'placeholder';

type ImageAsset = {
  bytes: Buffer;
  contentType: string;
  source: ImageSource;
  message: string;
};

type OpenverseResult = {
  url?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  mature?: boolean;
};

type WikimediaResult = {
  title?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    mime?: string;
  }>;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function extFromContentType(contentType: string) {
  if (contentType.includes('svg')) return 'svg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, ' ');
}

function looksSpecific(prompt: string) {
  const normalized = normalizePrompt(prompt);
  const words = normalized.split(' ').filter(Boolean);
  return /\d/.test(normalized) || words.length <= 3;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readErrorBody(response: Response) {
  const text = await response.text();
  if (!text) return '';

  try {
    const parsed = JSON.parse(text);
    return parsed.message || parsed.error || text;
  } catch {
    return text;
  }
}

function buildGenerationPrompt(prompt: string, bucket: string) {
  const base = normalizePrompt(prompt);
  const suffix = bucket === 'logos'
    ? 'school logo concept, centered composition, clean background, no text'
    : 'educational institution Peru, realistic photo, coherent scene, natural light, detailed composition, high quality';

  return `${base}, ${suffix}`;
}

async function generateWithPollinations(prompt: string, bucket: string): Promise<ImageAsset> {
  const size = bucket === 'logos'
    ? { width: 1024, height: 1024 }
    : { width: 1200, height: 800 };

  const seed = Math.floor(Math.random() * 99999);
  const imageUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(buildGenerationPrompt(prompt, bucket))}` +
    `?width=${size.width}&height=${size.height}&seed=${seed}&nologo=true`;

  const response = await fetchWithTimeout(imageUrl, { headers: REQUEST_HEADERS }, 18000);

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new Error(body || `Pollinations error ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    throw new Error('Pollinations did not return an image');
  }

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType,
    source: 'pollinations',
    message: 'Imagen generada correctamente',
  };
}

function buildWikimediaQueries(prompt: string, bucket: string) {
  const base = normalizePrompt(prompt);

  if (bucket === 'logos') {
    return [
      `${base} logo`,
      `${base} icon`,
      'school emblem',
      'education icon',
    ];
  }

  return [
    base,
    `${base} school`,
    `${base} classroom`,
    `${base} education`,
    'students classroom school',
    'school classroom education',
  ];
}

async function downloadImageCandidates(urls: string[]) {
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, { headers: REQUEST_HEADERS }, 20000);
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') ?? 'image/jpeg';
      if (!contentType.startsWith('image/')) continue;

      return {
        bytes: Buffer.from(await response.arrayBuffer()),
        contentType,
      };
    } catch {
      continue;
    }
  }

  throw new Error('No related image could be downloaded');
}

async function searchWikimedia(prompt: string, bucket: string): Promise<ImageAsset> {
  const queries = buildWikimediaQueries(prompt, bucket);

  for (const queryText of queries) {
    const searchUrl =
      'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
      `&gsrsearch=${encodeURIComponent(queryText)}` +
      '&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=1600&format=json&origin=*';

    const response = await fetchWithTimeout(searchUrl, { headers: REQUEST_HEADERS }, 15000);
    if (!response.ok) continue;

    const data = await response.json();
    const pages = data?.query?.pages
      ? (Object.values(data.query.pages) as WikimediaResult[])
      : [];

    const ranked = pages
      .map(page => {
        const info = page.imageinfo?.[0];
        return {
          title: page.title ?? '',
          mime: info?.mime ?? '',
          url: info?.url ?? '',
          thumburl: info?.thumburl ?? '',
        };
      })
      .filter(item => item.url || item.thumburl)
      .sort((a, b) => {
        const aIsImage = a.mime.startsWith('image/');
        const bIsImage = b.mime.startsWith('image/');
        if (aIsImage === bIsImage) return 0;
        return aIsImage ? -1 : 1;
      });

    if (ranked.length === 0) continue;

    for (const item of ranked) {
      try {
        const downloaded = await downloadImageCandidates(
          [item.url, item.thumburl].filter(Boolean) as string[],
        );

        return {
          ...downloaded,
          source: 'wikimedia',
          message: 'Se encontro una imagen real relacionada con tu tema.',
        };
      } catch {
        continue;
      }
    }
  }

  throw new Error('Wikimedia without results');
}

function buildOpenverseQueries(prompt: string, bucket: string) {
  const base = normalizePrompt(prompt);
  if (bucket === 'logos') {
    return [
      `${base} education icon`,
      `${base} school logo`,
      'education school icon',
    ];
  }

  return [
    `${base} school classroom education`,
    `${base} school`,
    `${base} education`,
    'students classroom school',
    'school classroom education',
  ];
}

async function downloadFirstOpenverseImage(results: OpenverseResult[]) {
  const ranked = results
    .filter(result => !result.mature)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));

  for (const result of ranked) {
    const downloaded = await downloadImageCandidates(
      [result.url, result.thumbnail].filter(Boolean) as string[],
    ).catch(() => null);

    if (downloaded) {
      return downloaded;
    }
  }

  throw new Error('No Openverse image could be downloaded');
}

async function searchOpenverse(prompt: string, bucket: string): Promise<ImageAsset> {
  const queries = buildOpenverseQueries(prompt, bucket);

  for (const queryText of queries) {
    const searchUrl =
      'https://api.openverse.org/v1/images/' +
      `?q=${encodeURIComponent(queryText)}&page_size=8&license=cc0,pdm&mature=false`;

    const response = await fetchWithTimeout(searchUrl, { headers: REQUEST_HEADERS }, 15000);
    if (!response.ok) continue;

    const data = await response.json();
    const results = Array.isArray(data.results) ? (data.results as OpenverseResult[]) : [];
    if (results.length === 0) continue;

    const downloaded = await downloadFirstOpenverseImage(results);

    return {
      ...downloaded,
      source: 'openverse',
      message: 'Se uso una imagen libre relacionada.',
    };
  }

  throw new Error('Openverse without results');
}

function createPlaceholderImage(prompt: string, bucket: string): ImageAsset {
  const title = normalizePrompt(prompt).slice(0, 42) || 'Imagen institucional';
  const subtitle = bucket === 'logos'
    ? 'Portada provisional para logo'
    : 'Portada provisional generada localmente';
  const width = bucket === 'logos' ? 1024 : 1200;
  const height = bucket === 'logos' ? 1024 : 800;
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1d4ed8" />
          <stop offset="100%" stop-color="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" rx="28" />
      <circle cx="${width / 2}" cy="${height / 2 - 90}" r="64" fill="rgba(255,255,255,0.16)" />
      <path d="M${width / 2 - 28} ${height / 2 - 90}h56M${width / 2} ${height / 2 - 118}v56" stroke="#ffffff" stroke-width="10" stroke-linecap="round" />
      <text x="50%" y="${height / 2 + 36}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="700">${safeTitle}</text>
      <text x="50%" y="${height / 2 + 92}" text-anchor="middle" fill="rgba(255,255,255,0.88)" font-family="Arial, sans-serif" font-size="24">${safeSubtitle}</text>
      <text x="50%" y="${height - 56}" text-anchor="middle" fill="rgba(255,255,255,0.72)" font-family="Arial, sans-serif" font-size="18">IEP Jesus de Nazaret</text>
    </svg>
  `.trim();

  return {
    bytes: Buffer.from(svg, 'utf-8'),
    contentType: 'image/svg+xml',
    source: 'placeholder',
    message: 'No hubo imagen externa disponible. Se creo una portada provisional.',
  };
}

async function createImageAsset(prompt: string, bucket: string) {
  const specific = looksSpecific(prompt);

  if (specific) {
    try {
      return await searchWikimedia(prompt, bucket);
    } catch (wikimediaError) {
      console.warn('Wikimedia first-pass fallback triggered:', wikimediaError);
    }
  }

  try {
    return await generateWithPollinations(prompt, bucket);
  } catch (pollinationsError) {
    console.warn('Pollinations fallback triggered:', pollinationsError);
  }

  try {
    return await searchWikimedia(prompt, bucket);
  } catch (wikimediaError) {
    console.warn('Wikimedia fallback triggered:', wikimediaError);
  }

  try {
    return await searchOpenverse(prompt, bucket);
  } catch (openverseError) {
    console.warn('Openverse fallback triggered:', openverseError);
  }

  return createPlaceholderImage(prompt, bucket);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const adminSession = await getAdminSessionFromRequest(request, cookies);
    if (!adminSession) {
      return jsonError('No autorizado', 401);
    }

    const supabase = createServerClient();
    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const bucket = typeof body.bucket === 'string' ? body.bucket : '';

    if (!prompt) {
      return json({ error: 'La descripcion de la imagen es obligatoria' }, 400);
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return json({ error: 'Bucket de imagenes no permitido' }, 400);
    }

    if (!import.meta.env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' }, 500);
    }

    const asset = await createImageAsset(prompt, bucket);
    const ext = extFromContentType(asset.contentType);
    const path = `${asset.source}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, asset.bytes, {
        upsert: false,
        contentType: asset.contentType,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return json({
      publicUrl,
      path,
      source: asset.source,
      message: asset.message,
    });
  } catch (err: any) {
    const message = err?.name === 'AbortError'
      ? 'Tiempo de espera agotado al generar la imagen'
      : err?.message || 'Error al generar la imagen';

    console.error('AI image API error:', err);
    return json({ error: message }, 500);
  }
};
