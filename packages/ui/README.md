# @qr-smart-order/ui

공유 UI 컴포넌트 라이브러리 패키지입니다.

## 설정

이 패키지는 shadcn/ui를 사용하여 구성되었습니다.

### shadcn/ui 컴포넌트 추가하기

```bash
# packages/ui 디렉토리에서 실행
npx shadcn-ui@latest add [component-name]
```

컴포넌트는 `src/components/ui/` 디렉토리에 추가됩니다.

## 사용법

```tsx
import { Button } from '@qr-smart-order/ui';
import { cn } from '@qr-smart-order/ui';

// 컴포넌트 사용
<Button>Click me</Button>

// 유틸리티 함수 사용
const className = cn('base-class', condition && 'conditional-class');
```

## 구조

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui 컴포넌트
│   │   └── index.ts
│   └── lib/
│       └── utils.ts      # 유틸리티 함수 (cn 등)
├── components.json       # shadcn/ui 설정
└── package.json
```
