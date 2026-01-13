# Supabase 보안 설정 가이드

이 문서는 QR Smart Order 프로젝트에서 Supabase 보안 설정을 구성하는 방법을 안내합니다.

## 1. CORS (Cross-Origin Resource Sharing) 설정

### Supabase 대시보드에서 설정

1. **Settings > API** 메뉴로 이동
2. **CORS Configuration** 섹션에서 허용할 도메인 추가:

#### 개발 환경
```
http://localhost:3000
http://localhost:3001
```

#### 프로덕션 환경
```
https://your-domain.com
https://api.your-domain.com
```

### 코드에서 CORS 설정 (NestJS API)

NestJS API에서 Supabase로의 요청을 허용하기 위해 CORS를 설정합니다:

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS 설정
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js 앱
      'https://your-domain.com', // 프로덕션 도메인
    ],
    credentials: true,
  });
  
  await app.listen(3001);
}
bootstrap();
```

## 2. Row Level Security (RLS) 정책

RLS는 데이터베이스 레벨에서 행 단위 접근 제어를 제공합니다.

### RLS 활성화

1. Supabase 대시보드에서 **Table Editor** 열기
2. 테이블 선택 (예: `menus`, `orders`)
3. **Settings** 탭으로 이동
4. **Enable Row Level Security** 토글 활성화

### 정책 예시

#### Menu 테이블 정책

```sql
-- 모든 사용자가 메뉴를 읽을 수 있도록 허용
CREATE POLICY "Allow public read access on menus"
ON menus FOR SELECT
USING (true);

-- 서버만 메뉴를 생성할 수 있도록 제한
-- (service_role key를 사용하는 경우 RLS를 우회하므로 별도 정책 불필요)
```

#### Order 테이블 정책

```sql
-- 모든 사용자가 주문을 생성할 수 있도록 허용
CREATE POLICY "Allow public insert on orders"
ON orders FOR INSERT
WITH CHECK (true);

-- 모든 사용자가 자신의 주문을 읽을 수 있도록 허용
-- (orderId를 URL 파라미터로 받는 경우)
CREATE POLICY "Allow public read own orders"
ON orders FOR SELECT
USING (true);

-- 서버만 주문 상태를 업데이트할 수 있도록 제한
-- (service_role key를 사용하는 경우 RLS를 우회)
```

### 정책 생성 방법

1. Supabase 대시보드에서 **Authentication > Policies** 메뉴로 이동
2. 테이블 선택
3. **New Policy** 클릭
4. 정책 타입 선택:
   - **SELECT**: 읽기 권한
   - **INSERT**: 생성 권한
   - **UPDATE**: 수정 권한
   - **DELETE**: 삭제 권한
5. 정책 이름 및 SQL 조건 입력
6. **Save** 클릭

## 3. API 키 관리

### Anon Key (공개 키)

- **용도**: 클라이언트 사이드에서 사용
- **보안**: RLS 정책으로 보호됨
- **노출**: 클라이언트 코드에 포함 가능 (NEXT_PUBLIC_ 접두사)

```typescript
// apps/web/src/lib/supabase/client.ts
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

### Service Role Key (비밀 키)

- **용도**: 서버 사이드에서만 사용
- **보안**: RLS 정책을 우회하므로 매우 신중하게 관리
- **노출**: 절대 클라이언트에 노출 금지

```typescript
// apps/api/src/lib/supabase.ts
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### 환경변수 관리

```env
# ✅ 클라이언트에 노출 가능
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# ❌ 서버 전용, 절대 클라이언트에 노출 금지
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_PASSWORD=...
```

## 4. 데이터베이스 접근 제어

### 연결 풀링 설정

Supabase는 연결 풀링을 제공합니다:

1. **Settings > Database** 메뉴로 이동
2. **Connection Pooling** 섹션에서:
   - **Transaction mode**: 일반적인 사용
   - **Session mode**: 세션 변수 사용이 필요한 경우

### 연결 문자열

#### 직접 연결 (Prisma 등)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

#### 연결 풀링 (권장)
```
postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## 5. 네트워크 보안

### IP 화이트리스트 (프로덕션)

프로덕션 환경에서는 특정 IP에서만 접근을 허용할 수 있습니다:

1. **Settings > Database** 메뉴로 이동
2. **Connection Pooling** 섹션에서:
   - **Allowed IP addresses** 설정
   - 서버 IP 주소 추가

### SSL 연결

Supabase는 기본적으로 SSL 연결을 사용합니다. Prisma 설정에서:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // SSL 연결 강제
  sslmode  = "require"
}
```

## 6. 인증 및 권한 관리

### 익명 사용자 접근

현재 프로젝트는 비회원 주문을 지원하므로:

1. **Authentication > Settings** 메뉴로 이동
2. **Enable anonymous sign-ins** 활성화 (선택사항)

### API 접근 제한

특정 API 엔드포인트에 대한 접근을 제한하려면:

```typescript
// apps/api/src/guards/supabase.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { supabase } from '../lib/supabase';

@Injectable()
export class SupabaseGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return false;
    }
    
    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data.user;
  }
}
```

## 7. 모니터링 및 로깅

### Supabase 대시보드 모니터링

1. **Logs** 메뉴에서 API 요청 로그 확인
2. **Database** 메뉴에서 쿼리 성능 모니터링
3. **Usage** 메뉴에서 리소스 사용량 확인

### 에러 처리

```typescript
// Supabase 에러 처리 예시
try {
  const { data, error } = await supabase.from('menus').select('*');
  
  if (error) {
    // RLS 정책 위반 등
    console.error('Supabase error:', error);
    throw new Error(error.message);
  }
  
  return data;
} catch (error) {
  // 네트워크 에러 등
  console.error('Unexpected error:', error);
  throw error;
}
```

## 8. 보안 체크리스트

- [ ] Service Role Key가 클라이언트 코드에 포함되지 않았는지 확인
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] RLS 정책이 적절히 설정되어 있는지 확인
- [ ] CORS 설정이 필요한 도메인만 허용하는지 확인
- [ ] 데이터베이스 비밀번호가 강력한지 확인
- [ ] 프로덕션 환경에서 IP 화이트리스트 설정 (선택사항)
- [ ] SSL 연결이 활성화되어 있는지 확인
- [ ] 정기적으로 API 키를 로테이션 (선택사항)

## 9. 문제 해결

### CORS 에러

```
Access to fetch at 'https://...supabase.co/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**해결 방법**:
1. Supabase 대시보드에서 CORS 설정 확인
2. NestJS API의 CORS 설정 확인

### RLS 정책 위반

```
new row violates row-level security policy
```

**해결 방법**:
1. 테이블의 RLS 정책 확인
2. Service Role Key 사용 여부 확인 (서버 사이드)
3. 정책 조건이 올바른지 확인

### 연결 에러

```
Connection refused
```

**해결 방법**:
1. 데이터베이스 비밀번호 확인
2. 연결 문자열 형식 확인
3. 네트워크 연결 확인
4. IP 화이트리스트 설정 확인

## 참고 자료

- [Supabase 보안 모범 사례](https://supabase.com/docs/guides/platform/security)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [CORS 설정 가이드](https://supabase.com/docs/guides/api/cors)
