// apps/web/src/app/test-supabase/page.tsx
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function TestSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div>
        <h1>Supabase 테스트 페이지</h1>
        <p>환경 변수가 설정되지 않았습니다.</p>
        <p>NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.</p>
      </div>
    );
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.from('menus').select('*').limit(1);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>Connected! Data: {JSON.stringify(data)}</div>;
}