// Integración con Google Gemini API
const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export type GeminiAction =
  | 'draft'
  | 'improve'
  | 'summarize'
  | 'correct'
  | 'communique'
  | 'seo'
  | 'rewrite'
  | 'title';

export type ToneType = 'formal' | 'cercano' | 'informativo' | 'breve';

interface GeminiRequest {
  action: GeminiAction;
  content?: string;
  topic?: string;
  tone?: ToneType;
  context?: string;
}

// Instrucción base que aplica a todos los prompts
const BASE = `Eres el redactor oficial de la I.E. Jesús de Nazaret, institución educativa pública de nivel secundaria en Bellavista, Celendín, Cajamarca, Perú.
REGLAS OBLIGATORIAS:
- Escribe SOLO el contenido solicitado, sin introducciones, explicaciones ni comentarios propios.
- NO uses markdown: sin asteriscos (**), sin almohadillas (###), sin guiones como separadores (---), sin backticks.
- Usa texto plano con párrafos separados por línea en blanco.
- Tono institucional, claro y apropiado para padres de familia y comunidad educativa.`;

function buildPrompt(req: GeminiRequest): string {
  const toneMap: Record<ToneType, string> = {
    formal:      'formal y profesional',
    cercano:     'cercano y amigable para padres de familia',
    informativo: 'informativo y objetivo',
    breve:       'muy breve y directo (máximo 3 oraciones)',
  };
  const tone = toneMap[req.tone ?? 'formal'];

  switch (req.action) {

    case 'draft':
      return `${BASE}

Escribe un artículo institucional completo sobre: "${req.topic ?? ''}"
Tono: ${tone}

Formato EXACTO de respuesta (sin markdown, sin símbolos extra):

TITULO: [escribe aquí el título, máximo 80 caracteres]

RESUMEN: [escribe aquí un resumen de 1-2 oraciones, máximo 150 caracteres]

CONTENIDO:
[escribe aquí el artículo completo en 3-4 párrafos de texto plano, sin títulos internos, sin listas con asteriscos]`;

    case 'improve':
      return `${BASE}

Mejora la redacción del siguiente texto. Tono: ${tone}.
Devuelve SOLO el texto mejorado, sin ningún comentario adicional.

Texto original:
${req.content ?? ''}`;

    case 'summarize':
      return `${BASE}

Resume el siguiente texto en 2 oraciones concisas (máximo 150 caracteres en total).
Devuelve SOLO el resumen, sin ningún comentario adicional.

Texto:
${req.content ?? ''}`;

    case 'correct':
      return `${BASE}

Corrige la ortografía y gramática del siguiente texto sin cambiar su contenido ni estilo.
Devuelve SOLO el texto corregido, sin ningún comentario adicional.

Texto:
${req.content ?? ''}`;

    case 'communique':
      return `${BASE}

Redacta un comunicado oficial para padres de familia sobre: "${req.topic ?? ''}"
Tono: formal e institucional.
Devuelve SOLO el comunicado en texto plano, sin markdown.`;

    case 'seo':
      return `${BASE}

Para el siguiente contenido, genera metadatos SEO.
Devuelve ÚNICAMENTE un JSON válido con exactamente estas 3 claves, sin texto antes ni después:
{"seo_title":"[máximo 60 caracteres]","seo_description":"[máximo 160 caracteres]","summary":"[máximo 120 caracteres]"}

Contenido:
${(req.content ?? req.topic ?? '').substring(0, 600)}`;

    case 'rewrite':
      return `${BASE}

Reescribe el siguiente texto con tono ${tone}.
Devuelve SOLO el texto reescrito, sin ningún comentario adicional.

Texto:
${req.content ?? ''}`;

    case 'title':
      return `${BASE}

Genera 5 títulos para una publicación sobre: "${req.topic ?? ''}"
Devuelve SOLO los 5 títulos, uno por línea, sin numeración, sin puntos, sin guiones al inicio.`;

    default:
      return `${BASE}\n\n${req.content ?? req.topic ?? ''}`;
  }
}

// Limpia el texto de markdown residual que Gemini a veces incluye
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')   // **bold** → bold
    .replace(/#{1,6}\s+/g, '')                   // ### Título → Título
    .replace(/^[-–—]{3,}\s*$/gm, '')             // --- separadores
    .replace(/`{1,3}[^`]*`{1,3}/g, '')           // `code`
    .replace(/^\s*[-*]\s+/gm, '')                // listas con - o *
    .replace(/\n{3,}/g, '\n\n')                  // múltiples líneas vacías
    .trim();
}

export async function callGemini(req: GeminiRequest): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada');

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(req) }] }],
      generationConfig: {
        temperature: 0.65,
        topK: 40,
        topP: 0.92,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message ?? 'Error al llamar a Gemini API');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía de Gemini');

  // Para SEO devolver el JSON sin limpiar
  if (req.action === 'seo') return text.trim();

  return cleanMarkdown(text);
}
