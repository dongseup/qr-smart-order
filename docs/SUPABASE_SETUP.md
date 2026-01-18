# Supabase 프로젝트 설정 가이드

이 문서는 QR Smart Order 프로젝트에서 Supabase를 설정하는 방법을 안내합니다.

## 1. Supabase 계정 생성 및 로그인

1. [Supabase 공식 웹사이트](https://supabase.com)에 접속
2. "Start your project" 버튼 클릭
3. GitHub 계정으로 로그인 (또는 이메일로 가입)

## 2. 새 프로젝트 생성

1. Supabase 대시보드에서 "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `qr-smart-order` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (반드시 저장해두세요!)
   - **Region**: 가장 가까운 리전 선택 (예: `Northeast Asia (Seoul)`)
   - **Pricing Plan**: Free tier 선택 (개발 단계)

3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 약 2-3분 대기

## 3. 프로젝트 정보 확인

프로젝트가 생성되면 다음 정보를 확인하세요:

### Settings > API 메뉴에서 확인:

1. **Project URL**
   - 형식: `https://[YOUR-PROJECT-ID].supabase.co`
   - 예시: `https://abcdefghijklmnop.supabase.co`

2. **Project API keys**
   - **anon public**: 클라이언트에서 사용하는 공개 키
   - **service_role**: 서버에서만 사용하는 비밀 키 (절대 클라이언트에 노출 금지!)

### Settings > Database 메뉴에서 확인:

1. **Connection string**
   - URI 형식: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres`
   - 이 정보는 Prisma 연결에 사용됩니다.

## 4. 환경변수 설정

### 루트 디렉토리 `.env` 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Database Connection String
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
DATABASE_PASSWORD=[YOUR-DATABASE-PASSWORD]

# API Configuration
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### apps/web/.env 파일 생성

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### apps/api/.env 파일 생성

```env
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
PORT=3001
NODE_ENV=development
```

**⚠️ 중요**: `.env` 파일은 절대 Git에 커밋하지 마세요! `.gitignore`에 이미 추가되어 있습니다.

## 5. CORS 설정 구성

Supabase 대시보드에서 CORS 설정을 구성합니다:

1. **Settings > API** 메뉴로 이동
2. **CORS Configuration** 섹션에서:
   - 개발 환경: `http://localhost:3000` 추가
   - 프로덕션 환경: 실제 도메인 추가 (예: `https://your-domain.com`)

또는 Supabase CLI를 사용하여 설정할 수 있습니다:

```bash
# Supabase CLI 설치 (선택사항)
# macOS의 경우 Homebrew 사용:
brew install supabase/tap/supabase

# 다른 플랫폼의 경우 공식 문서 참조:
# https://github.com/supabase/cli#install-the-cli

# 설치 확인
supabase --version

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref [YOUR-PROJECT-ID]
```

**참고**: Supabase CLI는 더 이상 `npm install -g`를 통한 글로벌 설치를 지원하지 않습니다. 위의 지원되는 패키지 매니저를 사용해주세요.

## 6. 데이터베이스 접근 정책 설정 (Row Level Security)

Supabase는 기본적으로 Row Level Security (RLS)를 사용합니다.

### RLS 활성화/비활성화

1. **Table Editor**에서 테이블 선택
2. **Settings** 탭으로 이동
3. **Enable Row Level Security** 토글 설정

### 정책 생성

**Settings > Authentication > Policies**에서 정책을 생성할 수 있습니다.

예시 정책 (Menu 테이블):

```sql
-- 모든 사용자가 메뉴를 읽을 수 있도록 허용
CREATE POLICY "Allow public read access on menus"
ON menus FOR SELECT
USING (true);

-- 서버만 메뉴를 생성/수정/삭제할 수 있도록 제한
-- (service_role key를 사용하는 경우 RLS를 우회하므로 별도 정책 불필요)
```

## 7. 연결 테스트

### 웹 앱에서 테스트

```typescript
// apps/web/src/app/test-supabase/page.tsx
import { supabase } from '@/lib/supabase';

export default async function TestSupabase() {
  const { data, error } = await supabase.from('menus').select('*').limit(1);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>Connected! Data: {JSON.stringify(data)}</div>;
}
```

### API에서 테스트

```typescript
// apps/api/src/test-supabase.controller.ts
import { Controller, Get } from "@nestjs/common";
import { supabase } from "./lib/supabase";

@Controller("test-supabase")
export class TestSupabaseController {
  @Get()
  async test() {
    const { data, error } = await supabase.from("menus").select("*").limit(1);

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  }
}
```

## 8. 보안 주의사항

1. **Service Role Key 보호**
   - `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트 코드에 포함하지 마세요
   - 서버 사이드에서만 사용하세요
   - 환경변수로 관리하고 Git에 커밋하지 마세요

2. **Anon Key 공개**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 클라이언트에 노출되어도 안전합니다
   - RLS 정책으로 접근을 제어하세요

3. **데이터베이스 비밀번호**
   - 강력한 비밀번호를 사용하세요
   - 비밀번호를 안전하게 보관하세요

## 9. 다음 단계

Supabase 프로젝트 설정이 완료되면:

1. [Prisma 설치 및 설정](./PRISMA_SETUP.md) 진행
2. 데이터베이스 스키마 마이그레이션 실행
3. 시드 데이터 생성

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트 가이드](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
