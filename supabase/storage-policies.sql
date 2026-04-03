-- Storage RLS Policies — ejecutar en Supabase → SQL Editor (rol: postgres)
-- Lectura pública + upload/delete para usuarios autenticados

DO $$
DECLARE b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['blog-images','gallery-images','documents','logos','hero-images']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'pub_'  || replace(b,'-','_'));
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'ins_'  || replace(b,'-','_'));
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'upd_'  || replace(b,'-','_'));
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'del_'  || replace(b,'-','_'));

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)',
      'pub_' || replace(b,'-','_'), b);

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND auth.role() = ''authenticated'')',
      'ins_' || replace(b,'-','_'), b);

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND auth.role() = ''authenticated'')',
      'upd_' || replace(b,'-','_'), b);

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND auth.role() = ''authenticated'')',
      'del_' || replace(b,'-','_'), b);
  END LOOP;
END $$;

-- Verificar
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
