# 환경변수 설정 및 관리 가이드

이 문서는 QR Smart Order API 프로젝트의 환경변수 설정 및 관리 방법을 설명합니다.

## 목차

1. [환경변수 파일 구조](#환경변수-파일-구조)
2. [필수 환경변수](#필수-환경변수)
3. [선택적 환경변수](#선택적-환경변수)
4. [환경별 설정](#환경별-설정)
5. [환경변수 유틸리티 사용법](#환경변수-유틸리티-사용법)
6. [보안 주의사항](#보안-주의사항)

## 환경변수 파일 구조

```
apps/api/
├── .env              # 실제 환경변수 (Git에 커밋하지 않음)
├── .env.example      # 환경변수 템플릿 (Git에 커밋됨)
└── src/
    └── lib/
        └── env.ts    # 환경변수 유틸리티
```

### 초기 설정

1. `.env.example` 파일을 `.env`로 복사:

   ```bash
   cd apps/api
   cp .env.example .env
   ```

2. `.env` 파일을 열고 실제 값으로 채우기

## 필수 환경변수

다음 환경변수는 애플리케이션 실행에 필수입니다:

### 데이터베이스 연결

```env
# Supabase 연결 풀링 (애플리케이션용)
# 포트 6543: Supavisor Transaction mode
DATABASE_URL="postgresql://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 직접 데이터베이스 연결 (마이그레이션용)
# 포트 5432: Supavisor Session mode
DIRECT_URL="postgresql://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"
```

**설정 방법**: [PRISMA_SETUP.md](./PRISMA_SETUP.md) 참고

### Supabase 설정

```env
# Supabase 프로젝트 URL
SUPABASE_URL="https://[YOUR-PROJECT-ID].supabase.co"

# Supabase Service Role Key (서버 전용)
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

**설정 방법**:

1. Supabase 대시보드 → Settings → API
2. Project URL 복사 → `SUPABASE_URL`에 입력
3. service_role key 복사 → `SUPABASE_SERVICE_ROLE_KEY`에 입력

## 선택적 환경변수

다음 환경변수는 선택사항이며, 기본값이 제공됩니다:

```env
# 서버 포트 (기본값: 3001)
PORT=3001

# 프론트엔드 URL (CORS 설정용, 기본값: http://localhost:3000)
FRONTEND_URL="http://localhost:3000"

# 환경 (기본값: development)
NODE_ENV="development"
```

## 환경별 설정

### 개발 환경 (Development)

```env
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 테스트 환경 (Test)

```env
NODE_ENV="test"
PORT=3001
FRONTEND_URL="http://localhost:3000"
# 테스트용 데이터베이스 URL 사용
DATABASE_URL="postgresql://..."
```

### 프로덕션 환경 (Production)

```env
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://your-domain.com"
# 프로덕션 데이터베이스 URL 사용
DATABASE_URL="postgresql://..."
```

**프로덕션 환경변수 관리**:

- 환경변수는 서버 환경에서 직접 설정하거나
- Docker Compose의 `environment` 섹션 사용
- Kubernetes의 `ConfigMap` 및 `Secret` 사용
- CI/CD 파이프라인에서 환경변수 주입

## 환경변수 유틸리티 사용법

프로젝트는 타입 안전한 환경변수 접근을 위한 유틸리티를 제공합니다:

```typescript
import { env, requireEnv } from "./lib/env";

// 애플리케이션 시작 시 환경변수 검증
requireEnv();

// 환경변수 접근
const dbUrl = env.DATABASE_URL;
const port = env.PORT;
const isDev = env.isDevelopment;
```

### 사용 가능한 속성

```typescript
// 데이터베이스
env.DATABASE_URL; // string
env.DIRECT_URL; // string

// Supabase
env.SUPABASE_URL; // string
env.SUPABASE_SERVICE_ROLE_KEY; // string
env.SUPABASE_ANON_KEY; // string

// 애플리케이션
env.PORT; // number
env.FRONTEND_URL; // string
env.NODE_ENV; // string

// 유틸리티
env.isDevelopment; // boolean
env.isProduction; // boolean
env.isTest; // boolean
```

### 환경변수 검증

애플리케이션 시작 시 자동으로 필수 환경변수를 검증합니다:

```typescript
// main.ts에서 자동 호출
requireEnv();
```

검증 실패 시:

- 누락된 환경변수 목록 출력
- 형식 오류 메시지 출력
- 애플리케이션 종료

## 보안 주의사항

### ⚠️ 절대 Git에 커밋하지 마세요

- `.env` 파일은 `.gitignore`에 포함되어 있습니다
- 실제 비밀번호, API 키 등은 절대 커밋하지 마세요
- `.env.example`만 Git에 커밋합니다 (민감 정보 제외)

### 🔐 민감한 정보 관리

1. **SUPABASE_SERVICE_ROLE_KEY**:
   - 서버에서만 사용
   - 클라이언트 코드에 포함 금지
   - RLS 정책을 우회하므로 매우 신중하게 관리

2. **데이터베이스 비밀번호**:
   - 강력한 비밀번호 사용
   - 정기적으로 변경
   - 프로덕션과 개발 환경 분리

3. **프로덕션 환경**:
   - 환경변수를 안전하게 관리
   - AWS Secrets Manager, HashiCorp Vault 등 사용 고려
   - 접근 권한 최소화

### ✅ 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `.env.example` 파일이 최신 상태인지 확인
- [ ] 프로덕션 환경변수가 안전하게 관리되고 있는지 확인
- [ ] 환경변수에 실제 비밀번호가 아닌 플레이스홀더가 있는지 확인
- [ ] 팀원들이 `.env.example`을 참고하여 자신의 `.env`를 생성할 수 있는지 확인

## 문제 해결

### 환경변수를 찾을 수 없음

```
❌ 환경변수 검증 실패:
누락된 필수 환경변수:
  - DATABASE_URL (데이터베이스 연결 URL)
```

**해결 방법**:

1. `.env` 파일이 `apps/api/` 디렉토리에 있는지 확인
2. `.env.example`을 복사하여 `.env` 생성
3. 필수 환경변수 값 입력

### 환경변수 형식 오류

```
❌ 환경변수 검증 실패:
환경변수 형식 오류:
  - DATABASE_URL은 postgresql://로 시작해야 합니다.
```

**해결 방법**:

1. 환경변수 값이 올바른 형식인지 확인
2. 따옴표가 올바르게 닫혀있는지 확인
3. 특수 문자가 URL 인코딩되었는지 확인

## 참고 자료

- [Prisma 환경변수 설정](./PRISMA_SETUP.md)
- [Supabase 환경변수 설정](../docs/SUPABASE_SETUP.md)
- [Supabase 보안 가이드](../docs/SUPABASE_SECURITY.md)
