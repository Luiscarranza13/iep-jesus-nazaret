-- ============================================================
-- Actualizar URLs de imágenes en la configuración
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- NOTA: Las URLs de Facebook CDN expiran. Cuando expiren,
-- actualízalas desde el Panel Admin → Configuración → Imágenes
-- ============================================================

UPDATE settings SET
  logo_url = 'https://scontent.flim9-1.fna.fbcdn.net/v/t39.30808-6/287194106_104240939096582_2519527103714913921_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEicJlqnEuRlyjoKt7whkja2IWO8TXpas_YhY7xNelqzyt4H3yqMTyv6mcVPKAc0XTP3KFIT-eTXRuP40MbXt2A&_nc_ohc=5kb-T5seVVgQ7kNvwG0pTxg&_nc_oc=AdoFDBVseZb475n-M8FPFJ0jAipklTspZgDHvI3nqWJcTQjH9sEVU31pQtguJgOCoDM&_nc_zt=23&_nc_ht=scontent.flim9-1.fna&_nc_gid=p6zA30yaN7fLUV022BbZBA&_nc_ss=7a3a8&oh=00_Af1wKdKnchNa06zQN_9Uzk74JSxqhzZXNd_VfL_a8SFqBA&oe=69D4AEDD',
  hero_image_url = 'https://scontent.flim9-1.fna.fbcdn.net/v/t39.30808-6/652324996_892890870231581_6416258328698868133_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeECcOT7_fOXc-6abkNEhLzYGejVJT0KKIQZ6NUlPQoohHcbM4oglBuOdjM6Jh8L0xYevS1BXbq9TApryJ5aFeMV&_nc_ohc=U4Xjy3NRn5kQ7kNvwFTN-LC&_nc_oc=AdpMqRuWN5ENeWSkT-KxxJTxKb2eunHO4yGNWPcIiwJX6NN3mVU_lR43fVBi474vDz0&_nc_zt=23&_nc_ht=scontent.flim9-1.fna&_nc_gid=hhYWBTTQSPqPUzZYU25DuQ&_nc_ss=7a3a8&oh=00_Af12Cv6uDbH0ySTdKXFQ_aybgc8MsYn64jxQxh4qaZQaEQ&oe=69D4ACC0',
  updated_at = NOW()
WHERE id = 1;

-- Verificar
SELECT id, school_name, logo_url IS NOT NULL as tiene_logo, hero_image_url IS NOT NULL as tiene_hero
FROM settings;
