import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY || env('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
