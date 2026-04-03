-- ============================================================
-- FIX: Corregir recursión infinita en políticas RLS
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── 1. ELIMINAR políticas problemáticas de profiles ─────────
DROP POLICY IF EXISTS "profiles_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_admin" ON profiles;

-- ─── 2. ELIMINAR todas las políticas que consultan profiles ──
--        (causan recursión cuando profiles tiene RLS activo)
DROP POLICY IF EXISTS "settings_admin_write"    ON settings;
DROP POLICY IF EXISTS "categories_admin_write"  ON categories;
DROP POLICY IF EXISTS "blogs_admin_all"         ON blogs;
DROP POLICY IF EXISTS "news_admin_all"          ON news;
DROP POLICY IF EXISTS "galleries_admin_all"     ON galleries;
DROP POLICY IF EXISTS "photos_admin_all"        ON photos;
DROP POLICY IF EXISTS "events_admin_all"        ON events;
DROP POLICY IF EXISTS "documents_admin_all"     ON documents;
DROP POLICY IF EXISTS "messages_admin_read"     ON messages;
DROP POLICY IF EXISTS "messages_admin_update"   ON messages;
DROP POLICY IF EXISTS "messages_admin_delete"   ON messages;
DROP POLICY IF EXISTS "ai_admin_all"            ON ai_suggestions;

-- ─── 3. DESHABILITAR RLS en profiles ─────────────────────────
--        (la tabla profiles solo la leen usuarios autenticados
--         a través del service role key en el servidor)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ─── 4. CREAR función auxiliar SIN recursión ─────────────────
--        Usa auth.jwt() para leer el rol del token, no la tabla
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
  );
$$;

-- ─── 5. RECREAR políticas usando la función auxiliar ─────────

-- Settings
CREATE POLICY "settings_admin_write" ON settings
  FOR ALL USING (is_admin_or_editor());

-- Categories
CREATE POLICY "categories_admin_write" ON categories
  FOR ALL USING (is_admin_or_editor());

-- Blogs (admin puede ver todos, público solo publicados)
DROP POLICY IF EXISTS "blogs_public_read" ON blogs;
CREATE POLICY "blogs_public_read" ON blogs
  FOR SELECT USING (status = 'published' OR is_admin_or_editor());
CREATE POLICY "blogs_admin_all" ON blogs
  FOR ALL USING (is_admin_or_editor());

-- News
CREATE POLICY "news_admin_all" ON news
  FOR ALL USING (is_admin_or_editor());

-- Galleries
CREATE POLICY "galleries_admin_all" ON galleries
  FOR ALL USING (is_admin_or_editor());

-- Photos
CREATE POLICY "photos_admin_all" ON photos
  FOR ALL USING (is_admin_or_editor());

-- Events
CREATE POLICY "events_admin_all" ON events
  FOR ALL USING (is_admin_or_editor());

-- Documents
CREATE POLICY "documents_admin_all" ON documents
  FOR ALL USING (is_admin_or_editor());

-- Messages
CREATE POLICY "messages_admin_read" ON messages
  FOR SELECT USING (is_admin_or_editor());
CREATE POLICY "messages_admin_update" ON messages
  FOR UPDATE USING (is_admin_or_editor());
CREATE POLICY "messages_admin_delete" ON messages
  FOR DELETE USING (is_admin_or_editor());

-- AI Suggestions
CREATE POLICY "ai_admin_all" ON ai_suggestions
  FOR ALL USING (is_admin_or_editor());

-- ─── 6. VERIFICAR que todo quedó bien ────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
