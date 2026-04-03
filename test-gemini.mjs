/**
 * test-gemini.mjs — Prueba los prompts de Gemini con el nuevo formato limpio
 * Ejecutar: node test-gemini.mjs
 */

const KEY = 'AIzaSyBu101dRCx2IWV7uVZzz40MTUqKafk0rvg';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`;

const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', dim:'\x1b[2m', bold:'\x1b[1m', cyan:'\x1b[36m', yellow:'\x1b[33m' };

const BASE = `Eres el redactor oficial de la I.E. Jesús de Nazaret, institución educativa pública de nivel secundaria en Bellavista, Celendín, Cajamarca, Perú.
REGLAS OBLIGATORIAS:
- Escribe SOLO el contenido solicitado, sin introducciones, explicaciones ni comentarios propios.
- NO uses markdown: sin asteriscos (**), sin almohadillas (###), sin guiones como separadores (---), sin backticks.
- Usa texto plano con párrafos separados por línea en blanco.
- Tono institucional, claro y apropiado para padres de familia y comunidad educativa.`;

async function ask(prompt) {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.65, maxOutputTokens: 1024 },
    }),
  });
  const d = await r.json();
  return { ok: r.ok, text: d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '', error: d?.error?.message };
}

function hasMarkdown(text) {
  return /\*{1,3}|\#{1,6}\s|^---$/m.test(text);
}

function sec(t) { console.log(`\n${C.bold}${C.cyan}── ${t} ──${C.reset}`); }

sec('1. BORRADOR (debe tener TITULO / RESUMEN / CONTENIDO)');
const draft = await ask(`${BASE}

Escribe un artículo institucional completo sobre: "inicio del año escolar 2026"
Tono: formal y profesional

Formato EXACTO de respuesta (sin markdown, sin símbolos extra):

TITULO: [escribe aquí el título, máximo 80 caracteres]

RESUMEN: [escribe aquí un resumen de 1-2 oraciones, máximo 150 caracteres]

CONTENIDO:
[escribe aquí el artículo completo en 3-4 párrafos de texto plano, sin títulos internos, sin listas con asteriscos]`);

if (draft.ok && draft.text) {
  const hasTitle   = /^TITULO:/im.test(draft.text);
  const hasResumen = /^RESUMEN:/im.test(draft.text);
  const hasContent = /^CONTENIDO:/im.test(draft.text);
  const hasMd      = hasMarkdown(draft.text);

  hasTitle   ? console.log(`${C.green}  ✓ Tiene TITULO:${C.reset}`)   : console.log(`${C.red}  ✗ Falta TITULO:${C.reset}`);
  hasResumen ? console.log(`${C.green}  ✓ Tiene RESUMEN:${C.reset}`)  : console.log(`${C.red}  ✗ Falta RESUMEN:${C.reset}`);
  hasContent ? console.log(`${C.green}  ✓ Tiene CONTENIDO:${C.reset}`) : console.log(`${C.red}  ✗ Falta CONTENIDO:${C.reset}`);
  !hasMd     ? console.log(`${C.green}  ✓ Sin markdown${C.reset}`)    : console.log(`${C.yellow}  ⚠ Contiene markdown residual${C.reset}`);

  // Mostrar extracto
  const lines = draft.text.split('\n').filter(l => l.trim());
  console.log(`${C.dim}  Preview:${C.reset}`);
  lines.slice(0, 6).forEach(l => console.log(`${C.dim}    ${l.substring(0, 90)}${C.reset}`));
} else {
  console.log(`${C.red}  ✗ Error: ${draft.error}${C.reset}`);
}

sec('2. SEO (debe devolver JSON puro)');
const seo = await ask(`${BASE}

Para el siguiente contenido, genera metadatos SEO.
Devuelve ÚNICAMENTE un JSON válido con exactamente estas 3 claves, sin texto antes ni después:
{"seo_title":"[máximo 60 caracteres]","seo_description":"[máximo 160 caracteres]","summary":"[máximo 120 caracteres]"}

Contenido: Inicio del año escolar 2026 en la I.E. Jesús de Nazaret. Los estudiantes retoman clases con nuevas metas y compromisos académicos.`);

if (seo.ok && seo.text) {
  try {
    const jsonMatch = seo.text.match(/\{[\s\S]*?\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}');
    parsed.seo_title       ? console.log(`${C.green}  ✓ seo_title: "${parsed.seo_title}"${C.reset}`)       : console.log(`${C.red}  ✗ Falta seo_title${C.reset}`);
    parsed.seo_description ? console.log(`${C.green}  ✓ seo_description: "${parsed.seo_description.substring(0,60)}..."${C.reset}`) : console.log(`${C.red}  ✗ Falta seo_description${C.reset}`);
    parsed.summary         ? console.log(`${C.green}  ✓ summary: "${parsed.summary}"${C.reset}`)           : console.log(`${C.red}  ✗ Falta summary${C.reset}`);
  } catch {
    console.log(`${C.red}  ✗ JSON inválido: ${seo.text.substring(0, 100)}${C.reset}`);
  }
} else {
  console.log(`${C.red}  ✗ Error: ${seo.error}${C.reset}`);
}

sec('3. RESUMIR (texto limpio, sin markdown)');
const sum = await ask(`${BASE}

Resume el siguiente texto en 2 oraciones concisas (máximo 150 caracteres en total).
Devuelve SOLO el resumen, sin ningún comentario adicional.

Texto:
Los estudiantes de la I.E. Jesús de Nazaret iniciaron el año escolar 2026 con entusiasmo. Se realizaron actividades de bienvenida, presentación de docentes y orientaciones académicas para el nuevo año.`);

if (sum.ok && sum.text) {
  const hasMd = hasMarkdown(sum.text);
  !hasMd ? console.log(`${C.green}  ✓ Sin markdown${C.reset}`) : console.log(`${C.yellow}  ⚠ Markdown residual${C.reset}`);
  console.log(`${C.dim}  "${sum.text.substring(0, 120)}"${C.reset}`);
} else {
  console.log(`${C.red}  ✗ Error: ${sum.error}${C.reset}`);
}

sec('4. TÍTULOS (5 líneas limpias)');
const titles = await ask(`${BASE}

Genera 5 títulos para una publicación sobre: "feria de ciencias 2026"
Devuelve SOLO los 5 títulos, uno por línea, sin numeración, sin puntos, sin guiones al inicio.`);

if (titles.ok && titles.text) {
  const lines = titles.text.split('\n').filter(l => l.trim());
  const hasMd = hasMarkdown(titles.text);
  console.log(`${C.green}  ✓ ${lines.length} títulos generados${C.reset}`);
  !hasMd ? console.log(`${C.green}  ✓ Sin markdown${C.reset}`) : console.log(`${C.yellow}  ⚠ Markdown residual${C.reset}`);
  lines.slice(0, 5).forEach(l => console.log(`${C.dim}    • ${l.substring(0, 80)}${C.reset}`));
} else {
  console.log(`${C.red}  ✗ Error: ${titles.error}${C.reset}`);
}

console.log(`\n${C.bold}  Prueba completada.${C.reset}\n`);
