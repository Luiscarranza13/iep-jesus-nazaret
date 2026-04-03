import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Cliente público (browser / SSR con anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Cliente de servidor con service role (solo para API routes)
// Si no hay service role key, usa la anon key como fallback (funcionalidad limitada)
export function createServerClient() {
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = (serviceKey && serviceKey !== 'your-service-role-key')
    ? serviceKey
    : supabaseAnonKey;
  return createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false },
  });
}
