/**
 * Script de pruebas del Panel Admin - I.E. Jesús de Nazaret
 * Ejecutar con: node test-panel.mjs
 * Requiere que el servidor esté corriendo en http://localhost:4321
 */

const BASE = 'http://localhost:4321';
const SUPABASE_URL = 'https://yvdbzepbqnkrlabqrjnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EM7x7q9xTgE3ARBsiDg0BA_jt1ypkQg';

// ─── Colores para la consola ──────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  yellow:'\x1b[33m',
  cyan:  '\x1b[36m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
};

let passed = 0, failed = 0, warnings = 0;

function log(icon, color, label, msg = '') {
  console.log(`${color}${icon} ${label}${c.reset}${msg ? c.dim + '  ' + msg + c.reset : ''}`);
}
function ok(label, msg)   { passed++;   log('✓', c.green,  label, msg); }
function fail(label, msg) { failed++;   log('✗', c.red,    label, msg); }
function warn(label, msg) { warnings++; log('⚠', c.yellow, label, msg); }
function section(title)   { console.log(`\n${c.bold}${c.cyan}── ${title} ──${c.reset}`); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function get(path) {
  try {
    const r = await fetch(`${BASE}${path}`);
    return { status: r.status, ok: r.ok, text: await r.text() };
  } catch (e) {
    return { status: 0, ok: false, text: '', error: e.message };
  }
}

async function post(path, body, headers = {}) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: r.status, ok: r.ok, json, text };
  } catch (e) {
    return { status: 0, ok: false, json: null, text: '', error: e.message };
  }
}

async function supabaseQuery(table, select = '*', filters = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
  for (const [k, v] of Object.entries(filters)) url += `&${k}=eq.${v}`;
  try {
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const json = await r.json();
    return { ok: r.ok, status: r.status, data: json };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e.message };
  }
}

// ─── 1. CONECTIVIDAD ─────────────────────────────────────────────────────────
section('1. Conectividad del servidor');

const home = await get('/');
if (home.status === 200) ok('Servidor corriendo en localhost:4321');
else fail('Servidor no responde', `status ${home.status} - ¿Corriste "npm run dev"?`);

// ─── 2. PÁGINAS PÚBLICAS ──────────────────────────────────────────────────────
section('2. Páginas públicas');

const publicPages = [
  ['/', 'Inicio'],
  ['/nosotros', 'Nosotros'],
  ['/niveles', 'Niveles'],
  ['/secundaria', 'Secundaria'],
  ['/blog', 'Blog'],
  ['/noticias', 'Noticias'],
  ['/eventos', 'Eventos'],
  ['/galeria', 'Galería'],
  ['/documentos', 'Documentos'],
  ['/contacto', 'Contacto'],
];

for (const [path, name] of publicPages) {
  const r = await get(path);
  if (r.status === 200) ok(`Página "${name}" carga correctamente`, path);
  else fail(`Página "${name}" falla`, `${path} → status ${r.status}`);
}

// ─── 3. PÁGINAS ADMIN ─────────────────────────────────────────────────────────
section('3. Páginas del panel admin');

const adminPages = [
  ['/admin/login',              'Login'],
  ['/admin',                    'Dashboard'],
  ['/admin/blogs',              'Blogs - listado'],
  ['/admin/blogs/nuevo',        'Blogs - nuevo'],
  ['/admin/noticias',           'Noticias - listado'],
  ['/admin/noticias/nuevo',     'Noticias - nuevo'],
  ['/admin/galerias',           'Galerías - listado'],
  ['/admin/galerias/nuevo',     'Galerías - nuevo'],
  ['/admin/eventos',            'Eventos - listado'],
  ['/admin/eventos/nuevo',      'Eventos - nuevo'],
  ['/admin/documentos',         'Documentos - listado'],
  ['/admin/documentos/nuevo',   'Documentos - nuevo'],
  ['/admin/mensajes',           'Mensajes'],
  ['/admin/configuracion',      'Configuración'],
];

for (const [path, name] of adminPages) {
  const r = await get(path);
  // 200 = carga normal, 302/301 = redirect a login (también válido)
  if (r.status === 200 || r.status === 302 || r.status === 301) {
    ok(`Admin "${name}" responde`, `${path} → ${r.status}`);
  } else {
    fail(`Admin "${name}" falla`, `${path} → status ${r.status}`);
  }
}

// ─── 4. API ENDPOINTS ─────────────────────────────────────────────────────────
section('4. API Endpoints');

// 4a. Contact API - campos faltantes
const contactMissing = await post('/api/contact', { name: 'Test' });
if (contactMissing.status === 400 && contactMissing.json?.error) {
  ok('API /api/contact valida campos requeridos', `→ 400 "${contactMissing.json.error}"`);
} else {
  fail('API /api/contact no valida campos', `status ${contactMissing.status}`);
}

// 4b. Contact API - email inválido
const contactBadEmail = await post('/api/contact', { name: 'Test', email: 'no-es-email', message: 'Hola' });
if (contactBadEmail.status === 400) {
  ok('API /api/contact rechaza email inválido');
} else {
  fail('API /api/contact acepta email inválido', `status ${contactBadEmail.status}`);
}

// 4c. Contact API - envío válido
const contactOk = await post('/api/contact', {
  name: 'Test Automatizado',
  email: 'test@ejemplo.com',
  message: 'Mensaje de prueba automatizada - puede ignorar',
  subject: 'Prueba',
});
if (contactOk.status === 200 && contactOk.json?.success) {
  ok('API /api/contact guarda mensaje correctamente');
} else if (contactOk.status === 500) {
  fail('API /api/contact error interno', contactOk.json?.error || contactOk.text?.substring(0, 100));
} else {
  warn('API /api/contact respuesta inesperada', `status ${contactOk.status}`);
}

// 4d. AI API - sin autenticación
const aiNoAuth = await post('/api/ai', { action: 'draft', topic: 'test' });
if (aiNoAuth.status === 401) {
  ok('API /api/ai requiere autenticación', '→ 401 sin token');
} else {
  fail('API /api/ai no protege el endpoint', `status ${aiNoAuth.status}`);
}

// 4e. AI API - token inválido
const aiBadToken = await post('/api/ai', { action: 'draft' }, { Authorization: 'Bearer token-falso' });
if (aiBadToken.status === 401) {
  ok('API /api/ai rechaza token inválido');
} else {
  fail('API /api/ai acepta token inválido', `status ${aiBadToken.status}`);
}

// ─── 5. BASE DE DATOS (Supabase) ──────────────────────────────────────────────
section('5. Conexión a Supabase y tablas');

const tables = ['settings', 'blogs', 'news', 'galleries', 'events', 'documents', 'messages', 'categories'];

for (const table of tables) {
  const r = await supabaseQuery(table, 'id', {});
  if (r.ok && Array.isArray(r.data)) {
    ok(`Tabla "${table}" accesible`, `${r.data.length} registros`);
  } else if (r.status === 401 || r.status === 403) {
    warn(`Tabla "${table}" requiere auth (RLS activo)`, 'normal si es tabla protegida');
  } else {
    fail(`Tabla "${table}" no accesible`, `status ${r.status} - ${JSON.stringify(r.data)?.substring(0, 80)}`);
  }
}

// ─── 6. SETTINGS - Configuración del sitio ────────────────────────────────────
section('6. Configuración del sitio (controla la web pública)');

const settingsRes = await supabaseQuery('settings', 'school_name,slogan,hero_image_url,logo_url,mission,vision');
if (settingsRes.ok && settingsRes.data?.length > 0) {
  const s = settingsRes.data[0];
  ok('Settings cargados desde Supabase');

  if (s.school_name) ok('Nombre del colegio configurado', s.school_name);
  else warn('Nombre del colegio vacío', 'ir a /admin/configuracion');

  if (s.slogan) ok('Lema institucional configurado', s.slogan.substring(0, 60));
  else warn('Lema vacío', 'ir a /admin/configuracion → Lema');

  if (s.hero_image_url) {
    ok('Hero image URL configurada', s.hero_image_url.substring(0, 60) + '...');
    // Verificar que la imagen sea accesible
    try {
      const imgRes = await fetch(s.hero_image_url, { method: 'HEAD' });
      if (imgRes.ok) ok('Hero image accesible (HTTP OK)');
      else warn('Hero image URL no responde', `status ${imgRes.status} - la portada no se verá`);
    } catch {
      warn('No se pudo verificar hero image', 'puede ser CORS o URL inválida');
    }
  } else {
    warn('Hero image NO configurada', 'la portada mostrará fondo degradado - ir a /admin/configuracion');
  }

  if (s.logo_url) ok('Logo URL configurado');
  else warn('Logo URL vacío', 'ir a /admin/configuracion → Imágenes');

  if (s.mission) ok('Misión institucional configurada');
  else warn('Misión vacía', 'ir a /admin/configuracion');

  if (s.vision) ok('Visión institucional configurada');
  else warn('Visión vacía', 'ir a /admin/configuracion');
} else {
  fail('No se pudieron cargar los settings', 'verificar RLS o conexión a Supabase');
}

// ─── 7. CONTENIDO PÚBLICO ─────────────────────────────────────────────────────
section('7. Contenido público (lo que ve el visitante)');

// Blogs publicados
const blogsRes = await supabaseQuery('blogs', 'id,title,status', { status: 'published' });
if (blogsRes.ok) {
  const count = blogsRes.data?.length || 0;
  if (count > 0) ok(`Blogs publicados: ${count}`, 'visibles en /blog');
  else warn('No hay blogs publicados', 'crear en /admin/blogs/nuevo y publicar');
}

// Noticias
const newsRes = await supabaseQuery('news', 'id,title');
if (newsRes.ok) {
  const count = newsRes.data?.length || 0;
  if (count > 0) ok(`Noticias: ${count}`, 'visibles en /noticias');
  else warn('No hay noticias', 'crear en /admin/noticias/nuevo');
}

// Galerías
const galRes = await supabaseQuery('galleries', 'id,title');
if (galRes.ok) {
  const count = galRes.data?.length || 0;
  if (count > 0) ok(`Galerías: ${count}`, 'visibles en /galeria');
  else warn('No hay galerías', 'crear en /admin/galerias/nuevo');
}

// Eventos
const evRes = await supabaseQuery('events', 'id,title,status');
if (evRes.ok) {
  const count = evRes.data?.length || 0;
  if (count > 0) ok(`Eventos: ${count}`, 'visibles en /eventos');
  else warn('No hay eventos', 'crear en /admin/eventos/nuevo');
}

// Documentos
const docRes = await supabaseQuery('documents', 'id,title');
if (docRes.ok) {
  const count = docRes.data?.length || 0;
  if (count > 0) ok(`Documentos: ${count}`, 'visibles en /documentos');
  else warn('No hay documentos', 'crear en /admin/documentos/nuevo');
}

// Mensajes recibidos
const msgRes = await supabaseQuery('messages', 'id,is_read');
if (msgRes.ok) {
  const total  = msgRes.data?.length || 0;
  const unread = msgRes.data?.filter(m => !m.is_read).length || 0;
  if (total > 0) ok(`Mensajes de contacto: ${total} (${unread} sin leer)`, 'ver en /admin/mensajes');
  else warn('No hay mensajes de contacto aún', 'normal si el sitio es nuevo');
}

// ─── 8. VERIFICAR HTML DE PÁGINAS CLAVE ───────────────────────────────────────
section('8. Verificación de contenido HTML');

// Página de inicio - debe tener hero section
const indexHtml = await get('/');
if (indexHtml.ok) {
  if (indexHtml.text.includes('Jesús de Nazaret') || indexHtml.text.includes('Bellavista')) {
    ok('Página inicio contiene nombre del colegio');
  } else {
    warn('Página inicio no muestra nombre del colegio', 'verificar settings en Supabase');
  }
  if (indexHtml.text.includes('<img') || indexHtml.text.includes('hero')) {
    ok('Página inicio tiene sección hero');
  } else {
    warn('No se detectó hero section en inicio');
  }
}

// Login page - debe tener formulario
const loginHtml = await get('/admin/login');
if (loginHtml.ok) {
  if (loginHtml.text.includes('email') || loginHtml.text.includes('password')) {
    ok('Página login tiene formulario de acceso');
  } else {
    fail('Página login no tiene formulario', 'revisar src/pages/admin/login.astro');
  }
}

// Dashboard - debe tener sidebar
const dashHtml = await get('/admin');
if (dashHtml.ok && dashHtml.status === 200) {
  if (dashHtml.text.includes('admin-sidebar') || dashHtml.text.includes('Dashboard')) {
    ok('Dashboard carga con sidebar');
  } else if (dashHtml.text.includes('login')) {
    warn('Dashboard redirige a login', 'normal - requiere sesión activa');
  }
}

// Configuración - debe tener campos de settings
const configHtml = await get('/admin/configuracion');
if (configHtml.ok && configHtml.status === 200) {
  const hasFields = ['school_name', 'hero_image_url', 'mission', 'vision'].every(f => configHtml.text.includes(f));
  if (hasFields) ok('Configuración tiene todos los campos del panel');
  else warn('Configuración puede tener campos faltantes');
}

// ─── 9. RESUMEN FINAL ─────────────────────────────────────────────────────────
console.log(`\n${c.bold}${'─'.repeat(50)}${c.reset}`);
console.log(`${c.bold}RESUMEN DE PRUEBAS${c.reset}`);
console.log(`${c.green}${c.bold}  ✓ Pasaron:    ${passed}${c.reset}`);
console.log(`${c.red}${c.bold}  ✗ Fallaron:   ${failed}${c.reset}`);
console.log(`${c.yellow}${c.bold}  ⚠ Avisos:     ${warnings}${c.reset}`);
console.log(`${'─'.repeat(50)}`);

if (failed === 0 && warnings === 0) {
  console.log(`\n${c.green}${c.bold}🎉 Todo funciona correctamente.${c.reset}`);
} else if (failed === 0) {
  console.log(`\n${c.yellow}${c.bold}Panel funcional con ${warnings} aviso(s). Revisar los ⚠ arriba.${c.reset}`);
} else {
  console.log(`\n${c.red}${c.bold}Hay ${failed} error(es) que necesitan atención. Revisar los ✗ arriba.${c.reset}`);
}

console.log(`\n${c.dim}Tip: Para probar el login real, usa las credenciales de Supabase Auth.${c.reset}`);
console.log(`${c.dim}     Panel: ${BASE}/admin/login${c.reset}\n`);
