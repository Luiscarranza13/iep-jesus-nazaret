/**
 * test-api-avatar.mjs
 * Prueba la API route /api/admin/upload-avatar directamente
 * Ejecutar con el servidor corriendo: node test-api-avatar.mjs
 */

import { readFileSync } from 'fs';

// PNG 1x1 pixel
const PNG_1X1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415408d763f8cfc00000000200011e221bc330000000049454e44ae426082',
  'hex'
);

const BASE_URL = 'http://localhost:4321';

console.log('Probando API route /api/admin/upload-avatar...\n');

// Crear FormData con el archivo
const formData = new FormData();
const blob = new Blob([PNG_1X1], { type: 'image/png' });
formData.append('file', blob, 'test-avatar.png');
formData.append('userId', 'test-user-123');

try {
  const res = await fetch(`${BASE_URL}/api/admin/upload-avatar`, {
    method: 'POST',
    body: formData,
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);

  if (res.ok) {
    const data = JSON.parse(text);
    console.log('\n✅ API funciona! URL:', data.publicUrl);
  } else {
    console.log('\n❌ API falló:', text);
  }
} catch (err) {
  console.log('❌ Error de conexión:', err.message);
  console.log('¿Está corriendo el servidor en localhost:4321?');
}
