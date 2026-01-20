# Smart Order API 상세 문서

## 📖 목차

1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [API 엔드포인트](#api-엔드포인트)
6. [모듈 구조](#모듈-구조)
7. [공통 기능](#공통-기능)
8. [환경 설정](#환경-설정)
9. [실행 방법](#실행-방법)
10. [테스트](#테스트)

---

## 개요

Smart Order API는 **QR 기반 스마트 주문 시스템**의 백엔드 서버입니다. 
NestJS 프레임워크를 기반으로 구축되었으며, 메뉴 관리와 주문 처리를 담당합니다.

### 주요 기능

- **메뉴 관리**: 메뉴 CRUD (생성, 조회, 수정, 삭제)
- **주문 처리**: 주문 생성, 조회, 상태 관리
- **실시간 통신**: WebSocket을 통한 주방/고객 실시간 알림
- **데이터 검증**: Zod 스키마 기반 요청/응답 검증

---

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| NestJS | ^10.0.0 | 백엔드 프레임워크 |
| Prisma | ^6.0.0 | ORM (데이터베이스 관리) |
| PostgreSQL | - | 데이터베이스 (Supabase) |
| Socket.io | ^4.8.3 | WebSocket 실시간 통신 |
| Zod | - | 스키마 검증 (shared-types) |
| Helmet | ^8.1.0 | 보안 헤더 |
| Throttler | ^6.5.0 | Rate Limiting |

---

## 프로젝트 구조

```
apps/api/
├── prisma/
│   ├── schema.prisma          # 데이터베이스 스키마
│   ├── seed.ts                # 초기 데이터 시드
│   └── migrations/            # 마이그레이션 파일
│
├── src/
│   ├── main.ts                # 애플리케이션 진입점
│   ├── app.module.ts          # 루트 모듈
│   ├── app.controller.ts      # 기본 컨트롤러
│   ├── app.service.ts         # 기본 서비스
│   │
│   ├── common/                # 공통 유틸리티
│   │   ├── decorators/
│   │   │   └── zod-validation.decorator.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts
│   │
│   ├── lib/                   # 라이브러리/설정
│   │   ├── env.ts             # 환경변수 관리
│   │   ├── prisma.module.ts   # Prisma 모듈
│   │   ├── prisma.service.ts  # Prisma 서비스
│   │   └── supabase.ts        # Supabase 클라이언트
│   │
│   ├── menus/                 # 메뉴 모듈
│   │   ├── menus.module.ts
│   │   ├── menus.controller.ts
│   │   ├── menu.service.ts
│   │   └── menu.repository.ts
│   │
│   ├── orders/                # 주문 모듈
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── order.service.ts
│   │   ├── orders.repository.ts
│   │   ├── order-number.service.ts
│   │   └── order-status.service.ts
│   │
│   └── websocket/             # WebSocket 모듈
│       ├── websocket.module.ts
│       └── websocket.gateway.**ts**
│
└── package.json
```

---

## 데이터베이스 스키마

### ERD (Entity Relationship Diagram)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      Menu       │       │   OrderItem     │       │      Order      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │    ┌──│ id (PK)         │
│ name            │  │    │ orderId (FK)    │────┘  │ orderNo (unique)│
│ price           │  └───>│ menuId (FK)     │       │ status          │
│ imageUrl        │       │ quantity        │       │ totalPrice      │
│ isSoldOut       │       │ price           │       │ createdAt       │
│ createdAt       │       │ createdAt       │       │ updatedAt       │
│ updatedAt       │       │ updatedAt       │       └─────────────────┘
└─────────────────┘       └─────────────────┘
```

### 모델 상세

#### Menu (메뉴)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본키 (자동 생성) |
| `name` | VARCHAR(100) | 메뉴 이름 |
| `price` | INT | 가격 (원) |
| `imageUrl` | TEXT | 이미지 URL (선택) |
| `isSoldOut` | BOOLEAN | 품절 여부 (기본: false) |
| `createdAt` | DATETIME | 생성 시간 |
| `updatedAt` | DATETIME | 수정 시간 |

#### Order (주문)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본키 (자동 생성) |
| `orderNo` | INT | 주문 번호 (일일 시퀀스) |
| `status` | ENUM | 주문 상태 |
| `totalPrice` | INT | 총 주문 금액 |
| `createdAt` | DATETIME | 주문 시간 |
| `updatedAt` | DATETIME | 상태 변경 시간 |

#### OrderItem (주문 항목)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기본키 (자동 생성) |
| `orderId` | UUID | 주문 ID (FK) |
| `menuId` | UUID | 메뉴 ID (FK) |
| `quantity` | INT | 수량 |
| `price` | INT | 주문 시점 가격 (스냅샷) |
| `createdAt` | DATETIME | 생성 시간 |
| `updatedAt` | DATETIME | 수정 시간 |

#### OrderStatus (주문 상태 Enum)

```typescript
enum OrderStatus {
  PENDING    = "PENDING",     // 대기 중 (주문 접수됨)
  COOKING    = "COOKING",     // 조리 중
  READY      = "READY",       // 준비 완료
  COMPLETED  = "COMPLETED"    // 완료 (수령됨)
}
```

### 상태 전환 규칙

```
PENDING ──────────────────────────────────> COMPLETED (취소)
   │                                             ↑
   └──> COOKING ──────────────────────────> COMPLETED (취소)
            │                                    ↑
            └──> READY ──────────────────────────┘
```

- **PENDING → COOKING**: 주방에서 조리 시작
- **COOKING → READY**: 조리 완료
- **READY → COMPLETED**: 고객 수령 완료
- **PENDING/COOKING → COMPLETED**: 주문 취소

---

## API 엔드포인트

### Base URL

```
http://localhost:3001
```

### 메뉴 API

#### 1. 메뉴 목록 조회

```http
GET /menus
GET /menus?includeSoldOut=true
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `includeSoldOut` | boolean | N | 품절 메뉴 포함 여부 (기본: false) |

**Response:**

```json
{
  "message": "메뉴 목록 조회",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "아메리카노",
      "price": 4500,
      "imageUrl": null,
      "isSoldOut": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 2. 메뉴 단일 조회

```http
GET /menus/:id
```

**Response:**

```json
{
  "message": "메뉴 조회",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "아메리카노",
    "price": 4500,
    "imageUrl": null,
    "isSoldOut": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### 3. 메뉴 생성

```http
POST /menus
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "카페라떼",
  "price": 5000,
  "imageUrl": "https://example.com/latte.jpg",
  "isSoldOut": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | Y | 메뉴 이름 (1-100자) |
| `price` | number | Y | 가격 (1-1,000,000) |
| `imageUrl` | string | N | 이미지 URL |
| `isSoldOut` | boolean | N | 품절 여부 (기본: false) |

**Response (201 Created):**

```json
{
  "message": "메뉴 생성되었습니다.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "카페라떼",
    "price": 5000,
    "imageUrl": "https://example.com/latte.jpg",
    "isSoldOut": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### 4. 메뉴 수정

```http
PATCH /menus/:id
Content-Type: application/json
```

**Request Body:**

```json
{
  "price": 5500,
  "isSoldOut": true
}
```

모든 필드는 선택적 (변경할 필드만 전송)

**Response:**

```json
{
  "message": "메뉴 수정되었습니다.",
  "data": { ... }
}
```

#### 5. 메뉴 삭제

```http
DELETE /menus/:id
```

**Response (204 No Content):**

- 응답 본문 없음

**에러 케이스:**

- `404`: 메뉴를 찾을 수 없음
- `409`: 주문에 사용 중인 메뉴 (삭제 불가)

---

### 주문 API

#### 1. 주문 생성

```http
POST /orders
Content-Type: application/json
```

**Request Body:**

```json
{
  "items": [
    {
      "menuId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2
    },
    {
      "menuId": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 1
    }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `items` | array | Y | 주문 항목 배열 (최소 1개) |
| `items[].menuId` | UUID | Y | 메뉴 ID |
| `items[].quantity` | number | Y | 수량 (1-100) |

**Response (201 Created):**

```json
{
  "message": "주문 생성되었습니다.",
  "data": {
    "id": "660e9400-e29b-41d4-a716-446655440000",
    "orderNo": 1,
    "status": "PENDING",
    "totalPrice": 14000,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "items": [
      {
        "id": "770e0500-e29b-41d4-a716-446655440000",
        "orderId": "660e9400-e29b-41d4-a716-446655440000",
        "menuId": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 2,
        "price": 9000,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "menu": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "아메리카노",
          "price": 4500,
          ...
        }
      }
    ]
  }
}
```

**주문 생성 시 처리 로직:**

1. 메뉴 존재 여부 및 품절 상태 확인
2. 총 가격 자동 계산 (메뉴 가격 × 수량)
3. 일일 주문 번호 자동 발급 (매일 1부터 시작)
4. 주문 시점 메뉴 가격 스냅샷 저장
5. WebSocket으로 주방에 신규 주문 알림 (`new_order`)

#### 2. 주문 목록 조회

```http
GET /orders
GET /orders?status=PENDING
GET /orders?status=PENDING&status=COOKING&limit=10&offset=0
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `status` | string | N | 주문 상태 필터 (복수 가능) |
| `limit` | number | N | 조회 개수 (최대 100) |
| `offset` | number | N | 건너뛸 개수 (페이지네이션) |

**Response:**

```json
{
  "message": "주문 목록 조회",
  "data": [
    {
      "id": "660e9400-e29b-41d4-a716-446655440000",
      "orderNo": 1,
      "status": "PENDING",
      "totalPrice": 14000,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

#### 3. 주문 단일 조회

```http
GET /orders/:id
```

**Response:**

```json
{
  "message": "주문 조회",
  "data": {
    "id": "660e9400-e29b-41d4-a716-446655440000",
    "orderNo": 1,
    "status": "COOKING",
    "totalPrice": 14000,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "items": [
      {
        "id": "...",
        "menuId": "...",
        "quantity": 2,
        "price": 9000,
        "menu": { ... }
      }
    ]
  }
}
```

#### 4. 주문 상태 변경

```http
PATCH /orders/:id/status
Content-Type: application/json
```

**Request Body:**

```json
{
  "status": "COOKING"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `status` | enum | Y | 새로운 상태 (PENDING/COOKING/READY/COMPLETED) |

**Response:**

```json
{
  "message": "주문 상태가 변경되었습니다.",
  "data": {
    "id": "660e9400-e29b-41d4-a716-446655440000",
    "orderNo": 1,
    "status": "COOKING",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**상태가 READY로 변경될 때:**

- WebSocket으로 해당 주문의 고객에게 알림 (`order_ready`)

---

### 에러 응답

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "message": "메뉴를 찾을 수 없습니다. (ID: xxx)",
  "error": "Not Found",
  "statusCode": 404,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/menus/xxx"
}
```

**주요 HTTP 상태 코드:**

| 코드 | 설명 |
|------|------|
| `200` | 성공 |
| `201` | 생성 완료 |
| `204` | 삭제 완료 (본문 없음) |
| `400` | 잘못된 요청 (검증 실패) |
| `404` | 리소스 없음 |
| `409` | 충돌 (삭제 불가 등) |
| `429` | 요청 제한 초과 |
| `500` | 서버 에러 |

---

## 모듈 구조

### 아키텍처 패턴

```
Controller ──> Service ──> Repository ──> Prisma ──> Database
     │              │
     │              └── Business Logic
     └── Request Validation (Zod)
```

### 레이어별 역할

| 레이어 | 역할 | 예시 |
|--------|------|------|
| **Controller** | HTTP 요청 처리, 응답 반환 | `menus.controller.ts` |
| **Service** | 비즈니스 로직 처리 | `menu.service.ts` |
| **Repository** | 데이터베이스 접근 | `menu.repository.ts` |

### Menus 모듈 상세

```typescript
// menus.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [MenusController],
  providers: [MenuService, MenuRepository],
  exports: [MenuService],
})
export class MenusModule {}
```

**주요 메서드:**

| 메서드 | 설명 |
|--------|------|
| `findAll(includeSoldOut)` | 메뉴 목록 조회 |
| `findOne(id)` | 메뉴 단일 조회 |
| `create(dto)` | 메뉴 생성 |
| `update(id, dto)` | 메뉴 수정 |
| `remove(id)` | 메뉴 삭제 |

### Orders 모듈 상세

```typescript
// orders.module.ts
@Module({
  imports: [PrismaModule, MenusModule],
  controllers: [OrdersController],
  providers: [
    OrderService,
    OrderRepository,
    OrderNumberService,
    OrderStatusService,
    AppWebSocketGateway,  // WebSocket 연동
  ],
})
export class OrdersModule {}
```

**서비스 분리:**

| 서비스 | 역할 |
|--------|------|
| `OrderService` | 주문 CRUD |
| `OrderNumberService` | 일일 주문 번호 발급 |
| `OrderStatusService` | 상태 전환 검증 및 변경 |

---

## 공통 기능

### 1. Zod 검증 데코레이터

요청 데이터를 Zod 스키마로 검증합니다.

```typescript
// 사용 예시
@Post()
@ZodValidation(CreateMenuRequestSchema)
async create(@Body() body: unknown) {
  // body는 검증된 데이터
}
```

**작동 방식:**

1. 컨트롤러 메서드 실행 전 Zod 스키마로 검증
2. 검증 실패 시 `400 Bad Request` 응답
3. 검증된 데이터를 컨트롤러로 전달

### 2. 글로벌 예외 필터

모든 예외를 일관된 형식으로 처리합니다.

```typescript
// global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // HTTP 상태 코드 결정
    // 에러 메시지 추출
    // 로깅
    // 응답 전송
  }
}
```

**특징:**

- 500 에러: 에러 레벨 로깅 (스택 트레이스 포함)
- 4xx 에러: 경고 레벨 로깅
- 개발 환경에서만 상세 정보 포함

### 3. Rate Limiting

```typescript
// app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,  // 60초
  limit: 100,  // 최대 100회 요청
}])
```

동일 IP에서 60초 내 100회 초과 요청 시 `429 Too Many Requests` 응답

### 4. 보안 설정

```typescript
// main.ts
app.use(helmet());  // 보안 헤더 설정

app.enableCors({
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

---

## 환경 설정

### 필수 환경변수

```env
# 데이터베이스
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/db

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 선택 환경변수 (기본값 제공)

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 환경변수 검증

애플리케이션 시작 시 자동으로 환경변수를 검증합니다.

```typescript
// main.ts
requireEnv();  // 필수 환경변수 없으면 즉시 종료
```

---

## 실행 방법

### 1. 의존성 설치

```bash
# 루트 디렉토리에서
npm install
```

### 2. 환경변수 설정

```bash
# apps/api/.env.example을 복사
cp apps/api/.env.example apps/api/.env

# .env 파일 수정
```

### 3. Prisma 설정

```bash
# 클라이언트 생성
npm run prisma:generate --workspace=@qr-smart-order/api

# 마이그레이션 실행
npm run prisma:migrate --workspace=@qr-smart-order/api

# (선택) 시드 데이터 추가
npm run prisma:seed --workspace=@qr-smart-order/api
```

### 4. 개발 서버 실행

```bash
# API 서버만 실행
npm run dev --workspace=@qr-smart-order/api

# 또는 전체 프로젝트 실행 (루트에서)
npm run dev
```

### 5. Prisma Studio (DB 관리 UI)

```bash
npm run prisma:studio --workspace=@qr-smart-order/api
```

---

## 테스트

### 연결 테스트

```bash
# Prisma 연결 테스트
npm run test:prisma --workspace=@qr-smart-order/api

# Supabase 통합 테스트
npm run test:integration --workspace=@qr-smart-order/api
```

### WebSocket 테스트

```bash
# 통합 테스트
npm run test:websocket --workspace=@qr-smart-order/api

# 부하 테스트
npm run test:websocket:load --workspace=@qr-smart-order/api
```

### API 테스트 (cURL 예시)

```bash
# 메뉴 목록 조회
curl http://localhost:3001/menus

# 메뉴 생성
curl -X POST http://localhost:3001/menus \
  -H "Content-Type: application/json" \
  -d '{"name":"아메리카노","price":4500}'

# 주문 생성
curl -X POST http://localhost:3001/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuId":"메뉴ID","quantity":2}]}'

# 주문 상태 변경
curl -X PATCH http://localhost:3001/orders/주문ID/status \
  -H "Content-Type: application/json" \
  -d '{"status":"COOKING"}'
```

---

## 자주 묻는 질문 (FAQ)

### Q: 주문 번호는 어떻게 생성되나요?

**A:** 일일 시퀀스 방식으로 생성됩니다.
- 매일 00:00에 1부터 시작
- 같은 날 주문이 들어올 때마다 +1
- 트랜잭션으로 동시성 이슈 방지

### Q: 메뉴가 삭제되면 기존 주문은 어떻게 되나요?

**A:** 주문에 사용 중인 메뉴는 삭제할 수 없습니다 (`409 Conflict`).
이미 생성된 주문의 메뉴 정보는 OrderItem에 스냅샷으로 저장되어 있어 영향받지 않습니다.

### Q: 품절 메뉴로 주문할 수 있나요?

**A:** 아니요, 품절 메뉴로 주문하면 `400 Bad Request` 에러가 발생합니다.

### Q: 주문 상태를 자유롭게 변경할 수 있나요?

**A:** 아니요, 정해진 상태 전환 규칙을 따라야 합니다.
예: PENDING에서 바로 READY로 변경 불가

---

## 추가 리소스

- [WebSocket 가이드](./websocket.md) - 실시간 통신 상세
- [Supabase 설정 가이드](./SUPABASE_SETUP.md)
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [Prisma 공식 문서](https://www.prisma.io/docs)

---

## 요약

| 항목 | 내용 |
|------|------|
| **기술 스택** | NestJS + Prisma + PostgreSQL + Socket.io |
| **메뉴 API** | GET/POST/PATCH/DELETE `/menus` |
| **주문 API** | GET/POST `/orders`, PATCH `/orders/:id/status` |
| **검증** | Zod 스키마 기반 요청/응답 검증 |
| **보안** | Helmet, CORS, Rate Limiting |
| **실시간** | WebSocket으로 주방/고객 알림 |
