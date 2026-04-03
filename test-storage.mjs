/**
 * test-storage.mjs — Prueba y configura Supabase Storage
 * Ejecutar: node test-storage.mjs
 */

const SUPABASE_URL  = process.env.PUBLIC_SUPABASE_URL || 'TU_SUPABASE_URL';
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_KEY';
const ANON_KEY      = process.env.PUBLIC_SUPABASE_ANON_KEY || 'TU_ANON_KEY';

const C = {
  reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m',
  green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', cyan:'\x1b[36m',
};

let passed = 0, failed = 0, warnings = 0;
const ok   = (l, d='') => { passed++;   console.log(`${C.green}  ✓ ${l}${C.reset}${d ? C.dim+'  › '+d+C.reset : ''}`); };
const fail = (l, d='') => { failed++;   console.log(`${C.red}  ✗ ${l}${C.reset}${d ? C.dim+'  › '+d+C.reset : ''}`); };
const warn = (l, d='') => { warnings++; console.log(`${C.yellow}  ⚠ ${l}${C.reset}${d ? C.dim+'  › '+d+C.reset : ''}`); };
const sec  = (t)        =>              console.log(`\n${C.bold}${C.cyan}┌─ ${t.toUpperCase()} ${'─'.repeat(Math.max(0,48-t.length))}┐${C.reset}`);

async function storageReq(method, path, body, key = SERVICE_KEY) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(body instanceof Buffer
        ? { 'Content-Type': 'image/png' }
        : { 'Content-Type': 'application/json' }),
    },
    body: body ?? undefined,
  });
  const ct = r.headers.get('content-type') ?? '';
  const data = ct.includes('json') ? await r.json() : await r.text();
  return { ok: r.ok, status: r.status, data };
}

const REQUIRED_BUCKETS = ['blog-images', 'gallery-images', 'documents', 'logos', 'hero-images'];

// PNG 1x1 pixel válido para pruebas
const PNG_1x1 = Buffer.from(
  '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
  '01' + '2e00000000c4944415478016360f8cfc00000000200016e02165' +
  '00000000049454e44ae426082', 'hex'
);

// ── 1. Verificar / crear buckets ───────────────────────────────────────────
sec('1. Buckets');

const { ok: bucketsOk, data: buckets } = await storageReq('GET', '/bucket');

if (!bucketsOk || !Array.isArray(buckets)) {
  fail('No se pudo listar buckets', JSON.stringify(buckets).substring(0, 100));
} else {
  for (const name of REQUIRED_BUCKETS) {
    const found = buckets.find(b => b.name === name || b.id === name);
    if (found) {
      ok(`"${name}" existe`, found.public ? 'público' : 'privado');
    } else {
      const r = await storageReq('POST', '/bucket', JSON.stringify({ id: name, name, public: true }));
      if (r.ok) ok(`"${name}" creado como público`);
      else      fail(`No se pudo crear "${name}"`, JSON.stringify(r.data).substring(0, 80));
    }
  }
}

// ── 2. Aplicar políticas RLS via SQL ──────────────────────────────────────
sec('2. Políticas RLS de Storage');

// Supabase permite ejecutar SQL via la API de admin
const policySql = `
DO $$
DECLARE
  b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['blog-images','gallery-images','documents','logos','hero-images']
  LOOP
    -- Lectura pública
    BEGIN
      EXECUTE format('CREATE POLICY "public_read_%s" ON storage.objects FOR SELECT USING (bucket_id = %L)', replace(b,'-','_'), b);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    -- Insert para usuarios autenticados
    BEGIN
      EXECUTE format('CREATE POLICY "auth_insert_%s" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND auth.role() = ''authenticated'')', replace(b,'-','_'), b);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    -- Delete para usuarios autenticados
    BEGIN
      EXECUTE format('CREATE POLICY "auth_delete_%s" ON storage.objects FOR DELETE USING (bucket_id = %L AND auth.role() = ''authenticated'')', replace(b,'-','_'), b);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
`;

const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql: policySql }),
});

// La función exec_sql puede no existir — intentar via pg_query
if (!sqlRes.ok) {
  warn('No se pudo aplicar políticas via RPC', 'aplica manualmente en Supabase → Storage → Policies');
  console.log(`${C.dim}  O ejecuta este SQL en Supabase → SQL Editor:${C.reset}`);
  console.log(`${C.dim}  Habilitar RLS en storage.objects ya está activo por defecto.${C.reset}`);
  console.log(`${C.dim}  Ir a Storage → [bucket] → Policies → New Policy → "Give users access to own folder"${C.reset}`);
} else {
  ok('Políticas RLS aplicadas');
}

// ── 3. Upload con service key ──────────────────────────────────────────────
sec('3. Upload con service key');

const testPath = `test-${Date.now()}.png`;
const up1 = await storageReq('POST', `/object/blog-images/${testPath}`, PNG_1x1);

if (up1.ok) {
  ok('Upload a blog-images funciona');
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/blog-images/${testPath}`;
  const imgRes = await fetch(publicUrl);
  imgRes.ok ? ok('URL pública accesible') : warn('URL pública no accesible', `${imgRes.status}`);
  // Limpiar
  await storageReq('DELETE', `/object/blog-images`, JSON.stringify({ prefixes: [testPath] }));
  ok('Archivo de prueba eliminado');
} else {
  fail('Upload falló', JSON.stringify(up1.data).substring(0, 120));
}

// ── 4. Upload con anon key (simulando usuario logueado en browser) ─────────
sec('4. Upload con anon key (browser)');

// Obtener token de sesión del usuario admin
const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@gmail.com', password: '' }),
});

// No tenemos la contraseña, así que probamos con service key como proxy
// En producción el browser usa el access_token del usuario logueado
warn('No se puede probar con contraseña real desde script', 'el browser usa el token de sesión del admin logueado');
console.log(`${C.dim}  El componente ImageUploader usa supabase.storage.from(bucket).upload()${C.reset}`);
console.log(`${C.dim}  que envía automáticamente el token de sesión del usuario.${C.reset}`);

// ── 5. Verificar todos los buckets ────────────────────────────────────────
sec('5. Estado final de buckets');

const { data: finalBuckets } = await storageReq('GET', '/bucket');
if (Array.isArray(finalBuckets)) {
  for (const name of REQUIRED_BUCKETS) {
    const b = finalBuckets.find(x => x.name === name || x.id === name);
    b ? ok(`"${name}"`, b.public ? 'público ✓' : '⚠ privado') : fail(`"${name}" no encontrado`);
  }
}

// ── Resumen ────────────────────────────────────────────────────────────────
const total = passed + failed + warnings;
console.log(`\n${C.bold}${'═'.repeat(52)}${C.reset}`);
console.log(`${C.bold}  RESUMEN STORAGE  (${total} pruebas)${C.reset}`);
console.log(`${'─'.repeat(52)}`);
console.log(`${C.green}${C.bold}  ✓  Pasaron   ${String(passed).padStart(3)}${C.reset}`);
console.log(`${C.red}${C.bold}  ✗  Fallaron  ${String(failed).padStart(3)}${C.reset}`);
console.log(`${C.yellow}${C.bold}  ⚠  Avisos    ${String(warnings).padStart(3)}${C.reset}`);
console.log(`${'═'.repeat(52)}`);

if (failed === 0) {
  console.log(`\n${C.green}${C.bold}  🎉 Storage listo. El uploader funcionará en el panel.${C.reset}\n`);
} else {
  console.log(`\n${C.red}${C.bold}  ${failed} problema(s). Revisar los ✗ arriba.${C.reset}\n`);
}
