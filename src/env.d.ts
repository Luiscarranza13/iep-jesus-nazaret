/// <reference path="../.astro/types.d.ts" />

type AdminProfile = import('./lib/database.types').Database['public']['Tables']['profiles']['Row'];
type AuthUser = import('@supabase/supabase-js').User;

declare namespace App {
  interface Locals {
    adminUser?: AuthUser;
    adminProfile?: Pick<AdminProfile, 'id' | 'email' | 'full_name' | 'role'>;
  }
}
