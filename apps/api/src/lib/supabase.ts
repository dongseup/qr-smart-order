import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Supabase 서버 클라이언트 (NestJS API에서 사용)
 * Service Role Key를 사용하므로 Row Level Security (RLS) 정책을 우회합니다.
 * 주의: 이 키는 절대 클라이언트에 노출되어서는 안 됩니다.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
