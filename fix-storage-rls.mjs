/**
 * fix-storage-rls.mjs
 * Configura los buckets de Storage para permitir uploads desde el panel.
 * Ejecutar: node fix-storage-rls.mjs
 */

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'TU_SUPABASE_URL';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_KEY';

const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', bold:'\x1b[1m', dim:'\x1b[2m', cyan:'\x1b[36m' };
const ok   = (m, d='') => console.log(`${C.green}  ✓ ${m}${C.reset}${d ? C.dim+' › '+d+C.reset : ''}`);
const fail = (m, d='') => console.log(`${C.red}  ✗ ${m}${C.reset}${d ? C.dim+' › '+d+C.reset : ''}`);
const warn = (m, d='') => console.log(`${C.yellow}  ⚠ ${m}${C.reset}${d ? C.dim+' › '+d+C.reset : ''}`);
const sec  = (t)        => console.log(`\n${C.bold}${C.cyan}── ${t} ──${C.reset}`);

const BUCKETS = ['blog-images', 'gallery-images', 'documents', 'logos', 'hero-images'];

// ── 1. Actualizar buckets: público + sin restricción de MIME + límite 5MB ──
sec('Configurando buckets');

for (const bucket of BUCKETS) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${bucket}`, {
    method: 'PUT',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public: true,
      allowedMimeTypes: null,   // sin restricción de tipo
      fileSizeLimit: 5242880,   // 5 MB
    }),
  });
  const d = await r.json();
  if (r.ok) ok(`"${bucket}" → público, 5MB máx`);
  else      fail(`"${bucket}"`, JSON.stringify(d).substring(0, 80));
}

// ── 2. Crear políticas via Management API ─────────────────────────────────
sec('Aplicando políticas RLS via Management API');

// Supabase tiene una API de management en api.supabase.com
// pero requiere un token de acceso personal, no el service key.
// La alternativa es usar el endpoint /rest/v1/rpc con una función SQL.

// Intentar crear una función RPC temporal para ejecutar el SQL
const createFnSql = `
CREATE OR REPLACE FUNCTION public.setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = storage
AS $$
DECLARE
  b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['blog-images','gallery-images','documents','logos','hero-images']
  LOOP
    -- Lectura pública
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)',
        'pub_read_' || replace(b, '-', '_'), b
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    -- Insert autenticados
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND auth.role() = ''authenticated'')',
        'auth_ins_' || replace(b, '-', '_'), b
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    -- Update autenticados
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND auth.role() = ''authenticated'')',
        'auth_upd_' || replace(b, '-', '_'), b
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    -- Delete autenticados
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND auth.role() = ''authenticated'')',
        'auth_del_' || replace(b, '-', '_'), b
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;
`;

// Crear la función via REST
const createFnRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql: createFnSql }),
});

if (!createFnRes.ok) {
  // exec_sql no existe, intentar crear la función directamente
  // usando el endpoint de query de Supabase
  warn('exec_sql no disponible, intentando método alternativo...');
}

// Llamar a la función si existe
const callRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/setup_storage_policies`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
});

if (callRes.ok) {
  ok('Políticas RLS aplicadas correctamente');
} else {
  const errData = await callRes.json().catch(() => ({}));
  warn('No se pudieron aplicar políticas via RPC', JSON.stringify(errData).substring(0, 80));
}

// ── 3. Verificar estado ────────────────────────────────────────────────────
sec('Estado final');

const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
const buckets = await listRes.json();

if (Array.isArray(buckets)) {
  for (const b of buckets.filter(x => BUCKETS.includes(x.id))) {
    ok(`"${b.id}"`, `público: ${b.public} | límite: ${b.file_size_limit ? b.file_size_limit/1024/1024+'MB' : 'sin límite'}`);
  }
}

// ── 4. Instrucciones manuales si RLS no se pudo aplicar ───────────────────
sec('Instrucciones para aplicar políticas manualmente');

console.log(`
${C.yellow}Si el upload sigue fallando con "row-level security policy":${C.reset}

${C.bold}Opción A — Dashboard (más fácil):${C.reset}
  1. Ve a: https://supabase.com/dashboard/project/yvdbzepbqnkrlabqrjnx/storage/buckets
  2. Para cada bucket (blog-images, gallery-images, documents, logos, hero-images):
     → Clic en el bucket → Policies → New Policy
     → Elige "For full customization"
     → Nombre: "allow_authenticated_upload"
     → Allowed operation: INSERT
     → Target roles: authenticated
     → USING expression: true
     → Guardar

${C.bold}Opción B — SQL Editor con permisos de superusuario:${C.reset}
  Ve a: https://supabase.com/dashboard/project/yvdbzepbqnkrlabqrjnx/sql/new
  Y ejecuta el siguiente SQL (requiere rol postgres):

${C.dim}  -- Habilitar uploads para usuarios autenticados en todos los buckets
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  SELECT 
    'allow_auth_' || operation || '_' || id,
    id,
    operation,
    '(auth.role() = ''authenticated'')'
  FROM 
    storage.buckets,
    (VALUES ('INSERT'), ('UPDATE'), ('DELETE')) AS ops(operation)
  WHERE id IN ('blog-images','gallery-images','documents','logos','hero-images')
  ON CONFLICT DO NOTHING;${C.reset}
`);
