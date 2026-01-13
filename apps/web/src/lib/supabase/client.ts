import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// 타입 가드 후에는 string 타입으로 확정됨
const url: string = supabaseUrl;
const key: string = supabaseAnonKey;

/**
 * Supabase 클라이언트 (브라우저에서 사용)
 * 이 클라이언트는 anon key를 사용하므로 Row Level Security (RLS) 정책이 적용됩니다.
 */
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
