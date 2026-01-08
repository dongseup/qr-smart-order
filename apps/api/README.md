# QR Smart Order - API Server

Nest.js 기반 REST API 서버

## 실행 방법

```bash
npm run dev
```

기본 포트: **3001**

## API 엔드포인트

- `GET /`: 기본 헬로우 메시지
- `GET /health`: 헬스 체크
- `GET /menus`: 메뉴 목록 조회
- `GET /orders`: 주문 목록 조회
- `POST /orders`: 주문 생성

## 구조

- `src/app.module.ts`: 루트 모듈
- `src/menus/`: 메뉴 관련 컨트롤러 및 서비스
- `src/orders/`: 주문 관련 컨트롤러 및 서비스
