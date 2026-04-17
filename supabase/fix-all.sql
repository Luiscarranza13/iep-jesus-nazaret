-- 1. Arreglar rol de admin (cambia el email por el tuyo)
UPDATE profiles SET role = 'admin' 
WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1);

-- 2. Verificar
SELECT email, role FROM profiles;

-- 3. Política permisiva para blog-images (service role bypassa RLS, pero por si acaso)
DROP POLICY IF EXISTS "allow_all_blog_images" ON storage.objects;
CREATE POLICY "allow_all_blog_images" ON storage.objects
  FOR ALL USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');
