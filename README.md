# QR Smart Order

QR 코드 기반 스마트 주문 시스템 모노레포 프로젝트입니다.

## 프로젝트 구조

```
smart-order/
├── apps/
│   ├── api/          # NestJS 백엔드 API
│   └── web/          # Next.js 프론트엔드
├── packages/
│   ├── shared-types/ # 공유 TypeScript 타입 및 Zod 스키마
│   ├── tsconfig/     # 공유 TypeScript 설정
│   └── ui/           # 공유 UI 컴포넌트 (shadcn/ui)
└── turbo.json        # Turbo 파이프라인 설정
```

## 시작하기

### 필수 요구사항

- Node.js >= 18.0.0
- npm >= 10.0.0

### 설치

```bash
npm install
```

### 개발

모든 앱과 패키지를 동시에 개발 모드로 실행:

```bash
npm run dev
```

개별 앱 실행:

```bash
# 웹 앱만 실행
cd apps/web && npm run dev

# API만 실행
cd apps/api && npm run dev
```

### 빌드

모든 패키지 빌드:

```bash
npm run build
```

### 린팅 및 포맷팅

```bash
# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 포맷 검사
npm run format:check

# 포맷 적용
npm run format
```

### 타입 체크

```bash
npm run typecheck
```

### 테스트

```bash
npm run test
```

### 정리

빌드 아티팩트 및 캐시 정리:

```bash
npm run clean
```

## 기술 스택

### 프론트엔드

- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트 라이브러리

### 백엔드

- **NestJS** - Node.js 프레임워크
- **TypeScript** - 타입 안정성

### 공유 패키지

- **@qr-smart-order/shared-types** - 공유 타입 및 Zod 스키마
- **@qr-smart-order/ui** - 공유 UI 컴포넌트
- **@qr-smart-order/tsconfig** - 공유 TypeScript 설정

### 도구

- **Turbo** - 모노레포 빌드 시스템
- **ESLint** - 코드 린팅
- **Prettier** - 코드 포맷팅

## 패키지별 상세 정보

### apps/web

Next.js 기반 웹 애플리케이션입니다.

### apps/api

NestJS 기반 REST API 서버입니다.

### packages/shared-types

프로젝트 전반에서 사용되는 TypeScript 타입과 Zod 스키마를 정의합니다.

### packages/ui

shadcn/ui를 사용한 공유 UI 컴포넌트 라이브러리입니다.

새로운 컴포넌트 추가:

```bash
cd packages/ui
npx shadcn-ui@latest add [component-name]
```

### packages/tsconfig

공유 TypeScript 설정 파일들:

- `base.json` - 기본 설정
- `nextjs.json` - Next.js 앱용 설정
- `node.json` - Node.js 앱용 설정

## Git 워크플로우

이 프로젝트는 Git을 사용한 버전 관리를 사용합니다.

### 브랜치 전략

- `main` - 프로덕션 배포 브랜치
- `develop` - 개발 브랜치 (선택사항)
- `feature/*` - 기능 개발 브랜치

### 커밋 메시지

명확하고 의미 있는 커밋 메시지를 작성해주세요.

## 라이선스

Private
