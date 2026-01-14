# Supabase 권한 오류 해결 가이드

## 문제 상황

`permission denied for table [table_name]` 또는 `permission denied for schema public` 오류 (에러 코드: 42501)가 발생하는 경우, Supabase PostgREST API의 테이블 권한 문제입니다.

### 원인

- **Prisma는 정상 작동**: Prisma는 데이터베이스에 직접 연결하므로 정상 작동합니다
- **Supabase 클라이언트 오류**: Supabase 클라이언트는 PostgREST API를 통해 접근하는데, 테이블에 대한 권한이 필요합니다
- **Service Role Key는 올바름**: 키 자체는 문제가 없지만, 데이터베이스 레벨 권한이 필요합니다

## 원인 분석

1. **Service Role Key 문제**: 키 형식은 올바르지만 실제 권한이 없을 수 있습니다
2. **데이터베이스 사용자 권한**: Supabase 프로젝트의 데이터베이스 사용자 권한 설정 문제
3. **RLS 정책**: Row Level Security 정책이 Service Role Key에도 영향을 줄 수 있습니다

## 해결 방법

### 방법 1: 테이블 권한 부여 (가장 빠른 해결책) ⭐

이 방법이 가장 빠르고 확실한 해결책입니다.

1. **Supabase 대시보드 → SQL Editor로 이동**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택
   - 왼쪽 메뉴에서 **SQL Editor** 클릭

2. **권한 부여 SQL 실행**
   
   다음 SQL을 복사하여 실행하세요:
   
   ```sql
   -- 모든 테이블에 대한 권한 부여
   GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
   
   -- 특정 테이블에 대한 명시적 권한 부여
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.menus TO service_role;
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO service_role;
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO service_role;
   
   -- 향후 생성될 테이블에 대한 기본 권한 설정
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
     GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
   ```

   또는 `fix-supabase-permissions.sql` 파일의 전체 내용을 실행하세요.

3. **재테스트**
   ```bash
   cd apps/api
   npm run debug:supabase
   ```

4. **예상 결과**
   ```
   3. 데이터베이스 연결 테스트
      ✅ 연결 성공!
      조회된 데이터: 1개
   ```

### 방법 2: Service Role Key 재확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **API 키 확인**
   - Settings → API 메뉴로 이동
   - **Project API keys** 섹션 확인
   - `service_role` 키를 **완전히 복사** (전체 키)

3. **키 형식 확인**
   - 올바른 형식: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (매우 긴 문자열)
   - 키는 약 200자 이상이어야 합니다

4. **환경변수 업데이트**
   ```bash
   # apps/api/.env 파일 수정
   SUPABASE_SERVICE_ROLE_KEY="[새로 복사한 전체 키]"
   ```
   
   **주의사항**:
   - 키 앞뒤 공백 제거
   - 따옴표는 선택사항이지만 공백이 있다면 사용
   - `anon` key가 아닌 `service_role` key인지 확인

5. **재테스트**
   ```bash
   npm run debug:supabase
   ```

### 방법 2: Supabase 프로젝트 상태 확인

1. **프로젝트 활성 상태 확인**
   - Supabase 대시보드에서 프로젝트가 **활성(Active)** 상태인지 확인
   - 프로젝트가 일시 중지되었다면 재개

2. **데이터베이스 연결 확인**
   - Settings → Database 메뉴로 이동
   - Connection string이 올바른지 확인

### 방법 3: 데이터베이스 사용자 권한 확인

Supabase는 기본적으로 `postgres` 사용자를 사용합니다. Prisma는 별도의 사용자(`prisma`)를 사용할 수 있습니다.

1. **Supabase SQL Editor에서 확인**
   ```sql
   -- 현재 사용자 확인
   SELECT current_user;
   
   -- 스키마 권한 확인
   SELECT schema_name, schema_owner 
   FROM information_schema.schemata 
   WHERE schema_name = 'public';
   ```

2. **권한 부여 (필요한 경우)**
   ```sql
   -- public 스키마에 대한 권한 부여
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

### 방법 4: Supabase 클라이언트 설정 확인

현재 코드는 올바르게 설정되어 있습니다:

```typescript
// apps/api/src/lib/supabase.ts
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,  // service_role key 사용
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**확인 사항**:
- `service_role` key를 사용하는지 확인 (anon key 아님)
- 클라이언트 생성 시 올바른 URL과 키가 전달되는지 확인

### 방법 5: Supabase 대시보드에서 직접 테스트

1. **Supabase 대시보드 → Table Editor**
   - `menus` 테이블이 존재하는지 확인
   - 데이터가 있는지 확인

2. **SQL Editor에서 직접 쿼리**
   ```sql
   SELECT * FROM menus LIMIT 1;
   ```
   - 이 쿼리가 성공하면 데이터베이스 자체는 정상
   - 문제는 Supabase 클라이언트 설정일 가능성이 높음

## 추가 디버깅

### 환경변수 확인 스크립트 실행

```bash
cd apps/api
npm run debug:supabase
```

이 스크립트는 다음을 확인합니다:
- 환경변수 설정 상태
- Service Role Key 형식
- Supabase 연결 테스트
- Prisma 연결 상태 비교

### 로그 확인

Supabase 클라이언트에 로깅을 추가하여 더 자세한 정보를 확인할 수 있습니다:

```typescript
const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'qr-smart-order-api',
      },
    },
  }
);
```

## 예상 결과

문제가 해결되면 다음 메시지가 표시됩니다:

```
3. 데이터베이스 연결 테스트
   ✅ 연결 성공!
   조회된 데이터: 1개
```

## 참고 자료

- [Supabase API Keys 문서](https://supabase.com/docs/guides/api/api-keys)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys#service-role-key)
