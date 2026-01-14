-- Supabase 테이블 권한 부여 스크립트
-- 
-- 실행 방법:
-- 1. Supabase 대시보드 → SQL Editor로 이동
-- 2. 이 스크립트를 복사하여 실행
-- 3. 또는 Supabase CLI를 사용하여 실행

-- ============================================
-- 1. PostgREST가 접근할 수 있도록 권한 부여
-- ============================================

-- public 스키마에 대한 사용 권한 부여
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 모든 테이블에 대한 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 모든 시퀀스에 대한 권한 부여
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 모든 함수에 대한 권한 부여
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- 2. 특정 테이블에 대한 명시적 권한 부여
-- ============================================

-- menus 테이블
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.menus TO postgres, anon, authenticated, service_role;

-- orders 테이블
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO postgres, anon, authenticated, service_role;

-- order_items 테이블
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO postgres, anon, authenticated, service_role;

-- ============================================
-- 3. 향후 생성될 테이블에 대한 기본 권한 설정
-- ============================================

-- postgres 사용자가 생성하는 모든 테이블에 대한 기본 권한
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ============================================
-- 4. 권한 확인 쿼리
-- ============================================

-- 테이블 권한 확인
SELECT 
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('menus', 'orders', 'order_items')
ORDER BY table_name, grantee;

-- 현재 사용자 확인
SELECT current_user, current_database();
