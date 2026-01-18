import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase 클라이언트를 가져옵니다 (브라우저에서 사용)
 * 이 클라이언트는 anon key를 사용하므로 Row Level Security (RLS) 정책이 적용됩니다.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

// supabase 변수는 이전 버전 호환성을 위해 유지되지만,
// 빌드 시점 에러를 방지하기 위해 getSupabaseClient() 함수를 사용하세요.
export const supabase = null as ReturnType<typeof getSupabaseClient> | null;
