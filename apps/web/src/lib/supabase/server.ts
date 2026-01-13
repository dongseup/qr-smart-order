import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
 * Supabase 서버 클라이언트 (Server Components, Server Actions에서 사용)
 * Next.js의 cookies()를 사용하여 클라이언트의 세션을 가져옵니다.
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  });
}
