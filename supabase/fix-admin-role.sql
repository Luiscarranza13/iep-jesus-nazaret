-- Actualizar el rol del primer usuario registrado a admin
-- Ejecutar en Supabase SQL Editor

UPDATE profiles SET role = 'admin' WHERE email = (
  SELECT email FROM profiles ORDER BY created_at ASC LIMIT 1
);

-- Verificar
SELECT id, email, full_name, role FROM profiles;
