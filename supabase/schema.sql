-- ============================================================
-- IEP Jesús de Nazaret - Supabase Schema
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── SETTINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  school_name TEXT NOT NULL DEFAULT 'IEP Jesús de Nazaret',
  slogan TEXT,
  history TEXT,
  mission TEXT,
  vision TEXT,
  values_text TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  facebook TEXT,
  instagram TEXT,
  youtube TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO settings (school_name, slogan, history, mission, vision, values_text, address, phone, email, whatsapp, facebook)
VALUES (
  'I.E. Jesús de Nazaret',
  'Educación secundaria de calidad para el desarrollo de Bellavista',
  'La Institución Educativa Jesús de Nazaret se encuentra ubicada en el centro poblado de Bellavista, en el distrito y provincia de Celendín, región Cajamarca. Desde su creación, ha sido un referente educativo para las familias de la zona, brindando educación secundaria pública y gratuita a jóvenes de 12 a 17 años bajo la modalidad de Educación Básica Regular.

A lo largo de los años, la institución ha consolidado su compromiso con la formación integral de sus estudiantes, combinando el desarrollo académico con la práctica de valores y el fortalecimiento de habilidades para la vida. Con grupos de aproximadamente 20 estudiantes por aula, se garantiza una atención más cercana y personalizada.

Hoy, la I.E. Jesús de Nazaret continúa siendo un espacio de oportunidades para los jóvenes de Bellavista y sus alrededores, con docentes comprometidos y una comunidad educativa unida en torno al progreso de sus estudiantes.',
  'Brindar una educación secundaria integral, inclusiva y de calidad a los jóvenes de Bellavista y la provincia de Celendín, promoviendo el desarrollo del pensamiento crítico, la práctica de valores y la formación de ciudadanos responsables, capaces de continuar estudios superiores o integrarse de manera productiva a la sociedad.',
  'Ser reconocida como una institución educativa de referencia en la provincia de Celendín, destacada por la calidad de su enseñanza, el compromiso de su comunidad educativa y la formación de jóvenes íntegros, críticos y preparados para los desafíos del mundo actual.',
  'Respeto • Responsabilidad • Honestidad • Disciplina • Solidaridad • Compromiso • Identidad',
  'Bellavista, Celendín, Cajamarca, Perú',
  '',
  '',
  '',
  'https://www.facebook.com/p/Institución-Educativa-Jesús-de-Nazaret-_-Bellavista-100085320282328/'
) ON CONFLICT DO NOTHING;

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('blog', 'news', 'document')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug, type) VALUES
  ('Institucional', 'institucional', 'blog'),
  ('Académico', 'academico', 'blog'),
  ('Deportivo', 'deportivo', 'blog'),
  ('Para padres', 'para-padres', 'blog'),
  ('Orientación', 'orientacion', 'blog')
ON CONFLICT DO NOTHING;

-- ─── BLOGS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NEWS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  type TEXT,
  featured BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GALLERIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS galleries (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PHOTOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  image_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCUMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  type TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MESSAGES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AI SUGGESTIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Settings: lectura pública, escritura solo admin
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write" ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Categories: lectura pública
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Blogs: publicados son públicos, admin puede todo
CREATE POLICY "blogs_public_read" ON blogs FOR SELECT USING (status = 'published');
CREATE POLICY "blogs_admin_all" ON blogs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- News: lectura pública
CREATE POLICY "news_public_read" ON news FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "news_admin_all" ON news FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Galleries y Photos: lectura pública
CREATE POLICY "galleries_public_read" ON galleries FOR SELECT USING (true);
CREATE POLICY "galleries_admin_all" ON galleries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "photos_public_read" ON photos FOR SELECT USING (true);
CREATE POLICY "photos_admin_all" ON photos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Events: lectura pública
CREATE POLICY "events_public_read" ON events FOR SELECT USING (true);
CREATE POLICY "events_admin_all" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Documents: lectura pública
CREATE POLICY "documents_public_read" ON documents FOR SELECT USING (true);
CREATE POLICY "documents_admin_all" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Messages: solo admin puede leer, cualquiera puede insertar
CREATE POLICY "messages_public_insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_admin_read" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "messages_admin_update" ON messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "messages_admin_delete" ON messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- AI Suggestions: solo admin
CREATE POLICY "ai_admin_all" ON ai_suggestions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Profiles: cada usuario ve su perfil, admin ve todos
CREATE POLICY "profiles_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- STORAGE BUCKETS
-- Crear en Supabase Dashboard > Storage > New Bucket
-- ============================================================
-- logos (public)
-- hero-images (public)
-- blog-images (public)
-- gallery-images (public)
-- documents (public)
