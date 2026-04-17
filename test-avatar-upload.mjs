/**
 * test-avatar-upload.mjs
 * Prueba el upload de avatar directamente a Supabase Storage
 * Ejecutar: node test-avatar-upload.mjs
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Leer .env manualmente
const envContent = readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
}

const SUPABASE_URL  = env.PUBLIC_SUPABASE_URL;
const ANON_KEY      = env.PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', SUPABASE_URL);
console.log('Anon key:', ANON_KEY?.slice(0, 20) + '...');
console.log('Service key:', SERVICE_KEY?.slice(0, 20) + '...');
console.log('');

// PNG 1x1 pixel válido
const PNG_1X1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415408d763f8cfc00000000200011e221bc330000000049454e44ae426082',
  'hex'
);

async function testUpload(label, client) {
  console.log(`\n=== Test: ${label} ===`);
  const path = `test-avatar-${Date.now()}.png`;

  const { data, error } = await client.storage
    .from('blog-images')
    .upload(path, PNG_1X1, { upsert: true, contentType: 'image/png' });

  if (error) {
    console.log('❌ UPLOAD FAILED:', error.message);
    return false;
  }

  const { data: { publicUrl } } = client.storage.from('blog-images').getPublicUrl(path);
  console.log('✅ UPLOAD OK');
  console.log('   Path:', data.path);
  console.log('   URL:', publicUrl);

  // Limpiar
  await client.storage.from('blog-images').remove([path]);
  console.log('   Limpiado OK');
  return true;
}

async function testProfileUpdate(client, label) {
  console.log(`\n=== Test DB Update: ${label} ===`);
  const { data, error } = await client
    .from('profiles')
    .select('id, email, role, avatar_url')
    .limit(1)
    .single();

  if (error) {
    console.log('❌ DB READ FAILED:', error.message);
    return;
  }
  console.log('✅ Profile:', data);
}

// Test 1: Con anon key (sin sesión)
const anonClient = createClient(SUPABASE_URL, ANON_KEY);
await testUpload('Anon key (sin sesión)', anonClient);

// Test 2: Con service role key
const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
await testUpload('Service role key', serviceClient);
await testProfileUpdate(serviceClient, 'Service role');

// Test 3: Upload via REST directo
console.log('\n=== Test: REST directo con service key ===');
const path = `test-rest-${Date.now()}.png`;
const res = await fetch(`${SUPABASE_URL}/storage/v1/object/blog-images/${path}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY,
    'Content-Type': 'image/png',
    'x-upsert': 'true',
  },
  body: PNG_1X1,
});
const text = await res.text();
console.log(`Status: ${res.status}`);
console.log(`Response: ${text}`);

console.log('\n=== FIN ===');
