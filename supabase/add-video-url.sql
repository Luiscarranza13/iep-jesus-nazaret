-- Agregar campo video_url a la tabla events
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;
