// apps/web/src/app/test-supabase/page.tsx
import { createServerClient } from '@/lib/supabase';

export default async function TestSupabase() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('menus').select('*').limit(1);
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return <div>Connected! Data: {JSON.stringify(data)}</div>;
}