-- Arreglar políticas RLS de profiles para que cada usuario pueda leer su propio perfil

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin" ON profiles;

-- Cada usuario puede leer su propio perfil
CREATE POLICY "profiles_own_select" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Cada usuario puede actualizar su propio perfil
CREATE POLICY "profiles_own_update" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Admin puede ver y gestionar todos los perfiles
CREATE POLICY "profiles_admin_all" ON profiles 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
