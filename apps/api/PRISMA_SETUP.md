# Prisma 설정 가이드

이 문서는 Supabase와 Prisma를 연결하는 방법을 설명합니다.

## 참고 문서

- [Supabase Prisma 가이드](https://supabase.com/docs/guides/database/prisma)

## 현재 설정 상태

- **Prisma 버전**: 6.0.0 (Supabase 가이드와 호환)
- **Prisma Client 버전**: 6.0.0
- **스키마 파일**: `apps/api/prisma/schema.prisma`
- **환경 변수 파일**: `apps/api/.env`

## 프로젝트 구조

```
apps/api/
├── prisma/
│   └── schema.prisma          # Prisma 스키마 정의
├── src/
│   └── lib/
│       ├── prisma.service.ts  # Prisma 서비스 (이미 구현됨)
│       └── prisma.module.ts   # Prisma 모듈 (이미 구현됨)
└── .env                       # 환경 변수 파일 (생성 필요)
```

## 1. Supabase에서 Prisma 전용 사용자 생성

Supabase SQL Editor에서 다음 SQL을 실행하여 Prisma 전용 사용자를 생성하세요:

```sql
-- Create custom user
create user "prisma" with password 'custom_password' bypassrls createdb;

-- extend prisma's privileges to postgres (necessary to view changes in Dashboard)
grant "prisma" to "postgres";

-- Grant it necessary permissions over the relevant schemas (public)
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

**보안**: 비밀번호는 강력한 패스워드 생성기를 사용하세요.

**비밀번호 변경**:

```sql
alter user "prisma" with password 'new_password';
```

## 2. 환경 변수 설정

`apps/api/.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Connect to Supabase via connection pooling (for application use)
# 포트 6543: Supavisor Transaction mode (서버리스/자동 스케일링 환경용)
DATABASE_URL="postgresql://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database (for migrations)
# 포트 5432: Supavisor Session mode (마이그레이션용)
DIRECT_URL="postgresql://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"
```

### 값 변경 방법:

1. Supabase 대시보드에서 프로젝트를 선택
2. **Settings** > **Database** 섹션으로 이동
3. **Connection string** 섹션에서 연결 문자열 복사
4. 연결 문자열에서:
   - `[DB-USER]`를 `prisma`로 변경
   - `[PRISMA-PASSWORD]`를 1단계에서 생성한 비밀번호로 변경
   - `[DB-REGION]`은 Supabase가 제공하는 지역으로 변경 (예: `aws-1-ap-southeast-2`)
   - `[PROJECT-REF]`는 프로젝트 참조 ID로 변경

### 예시:

```env
DATABASE_URL="postgresql://prisma.ekgzfnsgxtoavjewrkzc:your_secure_password@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://prisma.ekgzfnsgxtoavjewrkzc:your_secure_password@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
```

**중요 사항**:

- 비밀번호에 특수 문자가 포함된 경우 URL 인코딩이 필요할 수 있습니다
- `.env` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함되어 있어야 함)

## 3. Prisma 클라이언트 생성

환경 변수를 설정한 후 Prisma 클라이언트를 생성합니다:

```bash
cd apps/api
npm run prisma:generate
```

또는:

```bash
npx prisma generate
```

성공하면 다음과 같은 메시지가 표시됩니다:

```
✔ Generated Prisma Client (v6.19.2) to ./../../node_modules/@prisma/client
```

## 4. 데이터베이스 마이그레이션 생성 및 적용

스키마 변경사항을 데이터베이스에 적용합니다:

```bash
npm run prisma:migrate
```

또는:

```bash
npx prisma migrate dev
```

마이그레이션 이름을 입력하라는 프롬프트가 나타나면, 예: `init` 또는 `first_migration`을 입력하세요.

**마이그레이션 파일 위치**: `apps/api/prisma/migrations/`

## 5. Prisma Studio 실행 (선택사항)

데이터베이스를 시각적으로 확인하고 편집할 수 있습니다:

```bash
npm run prisma:studio
```

또는:

```bash
npx prisma studio
```

브라우저에서 `http://localhost:5555`가 자동으로 열립니다.

## 사용 가능한 Prisma 명령어

모든 명령어는 `apps/api` 디렉토리에서 실행하세요:

| 명령어                          | 설명                                    |
| ------------------------------- | --------------------------------------- |
| `npm run prisma:generate`       | Prisma 클라이언트 생성                  |
| `npm run prisma:migrate`        | 개발 환경에서 마이그레이션 생성 및 적용 |
| `npm run prisma:migrate:deploy` | 프로덕션 환경에서 마이그레이션 적용     |
| `npm run prisma:studio`         | Prisma Studio 실행 (데이터베이스 GUI)   |
| `npm run prisma:format`         | Prisma 스키마 포맷팅                    |
| `npm run prisma:validate`       | Prisma 스키마 검증                      |

## NestJS에서 Prisma 사용하기

### 이미 구현된 구조

프로젝트에는 이미 `PrismaService`와 `PrismaModule`이 구현되어 있으며, `AppModule`에 통합되어 있습니다:

- **PrismaService** (`src/lib/prisma.service.ts`): Prisma 클라이언트를 래핑한 서비스
- **PrismaModule** (`src/lib/prisma.module.ts`): 전역 모듈로 설정되어 어디서든 사용 가능
- **AppModule** (`src/app.module.ts`): PrismaModule이 이미 import되어 있음

### 사용 예시

PrismaService는 전역으로 사용 가능합니다. 다음과 같이 주입하여 사용하세요:

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../lib/prisma.service";

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.menu.findMany({
      where: {
        isSoldOut: false,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.menu.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; price: number; imageUrl?: string }) {
    return this.prisma.menu.create({
      data,
    });
  }
}
```

### 관계 쿼리 예시

```typescript
// 주문과 함께 주문 항목 및 메뉴 정보 조회
async findOrderWithItems(orderId: string) {
  return this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menu: true,
        },
      },
    },
  });
}
```

## 데이터베이스 모델

현재 스키마에 정의된 모델:

### Menu (메뉴)

- `id`: UUID (기본 키)
- `name`: 메뉴 이름 (최대 100자)
- `price`: 가격 (정수)
- `imageUrl`: 이미지 URL (선택사항)
- `isSoldOut`: 품절 여부
- `createdAt`, `updatedAt`: 타임스탬프

### Order (주문)

- `id`: UUID (기본 키)
- `orderNo`: 주문 번호 (고유)
- `status`: 주문 상태 (PENDING, COOKING, READY, COMPLETED)
- `totalPrice`: 총 가격
- `createdAt`, `updatedAt`: 타임스탬프
- `items`: OrderItem 관계

### OrderItem (주문 항목)

- `id`: UUID (기본 키)
- `orderId`: 주문 ID (외래 키)
- `menuId`: 메뉴 ID (외래 키)
- `quantity`: 수량
- `price`: 가격
- `createdAt`: 생성 시간
- `order`: Order 관계
- `menu`: Menu 관계

## 문제 해결

### 연결 오류

**증상**: `Environment variable not found: DATABASE_URL` 또는 `Can't reach database server`

**해결 방법**:

1. `.env` 파일이 `apps/api/` 디렉토리에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (`DATABASE_URL`, `DIRECT_URL`)
3. 비밀번호에 특수 문자가 포함된 경우 URL 인코딩 확인
4. Supabase 대시보드에서 연결 정보를 다시 확인
5. Prisma 전용 사용자가 올바르게 생성되었는지 확인

### 마이그레이션 오류

**증상**: `Error: P1001: Can't reach database server` 또는 권한 오류

**해결 방법**:

1. `DIRECT_URL`이 올바르게 설정되었는지 확인 (포트 5432)
2. Prisma 전용 사용자가 올바른 권한을 가지고 있는지 확인
3. Supabase 대시보드에서 데이터베이스 연결 상태 확인
4. 방화벽이나 네트워크 설정 확인

### Prisma 클라이언트 생성 오류

**증상**: `Error: Prisma schema validation`

**해결 방법**:

1. 스키마 파일(`prisma/schema.prisma`)이 올바른지 확인
2. `npm run prisma:validate`로 스키마를 검증
3. Prisma 버전 확인: `npx prisma --version`
4. `node_modules` 삭제 후 재설치: `rm -rf node_modules && npm install`

### 타입 오류

**증상**: TypeScript에서 `PrismaClient` 타입을 찾을 수 없음

**해결 방법**:

1. Prisma 클라이언트 재생성: `npm run prisma:generate`
2. TypeScript 서버 재시작 (VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server")
3. `node_modules/@prisma/client` 디렉토리 확인

## 추가 리소스

- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Prisma NestJS 가이드](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prisma-client-in-serverless-environments)
- [Supabase 데이터베이스 문서](https://supabase.com/docs/guides/database)
