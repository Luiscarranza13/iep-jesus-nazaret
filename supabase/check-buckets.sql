-- Verificar buckets existentes
SELECT id, name, public FROM storage.buckets ORDER BY name;

-- Si blog-images no aparece, crearlo:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);
