/**
 * 환경변수 로드 및 검증 유틸리티
 * 
 * 애플리케이션 시작 시 필수 환경변수를 검증하고,
 * 타입 안전한 방식으로 환경변수에 접근할 수 있도록 합니다.
 */

/**
 * 환경변수 검증 결과
 */
interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  errors: string[];
}

/**
 * 필수 환경변수 목록
 */
const REQUIRED_ENV_VARS = {
  // 데이터베이스
  DATABASE_URL: '데이터베이스 연결 URL',
  DIRECT_URL: '직접 데이터베이스 연결 URL (마이그레이션용)',
  
  // Supabase
  SUPABASE_URL: 'Supabase 프로젝트 URL',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase Service Role Key',
} as const;

/**
 * 선택적 환경변수 (기본값 제공)
 */
const OPTIONAL_ENV_VARS = {
  PORT: '3001',
  FRONTEND_URL: 'http://localhost:3000',
  NODE_ENV: 'development',
} as const;

/**
 * 환경변수 검증
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  // 필수 환경변수 확인
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }

  // DATABASE_URL 형식 검증
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL은 postgresql://로 시작해야 합니다.');
  }

  // DIRECT_URL 형식 검증
  if (process.env.DIRECT_URL && !process.env.DIRECT_URL.startsWith('postgresql://')) {
    errors.push('DIRECT_URL은 postgresql://로 시작해야 합니다.');
  }

  // SUPABASE_URL 형식 검증
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
    errors.push('SUPABASE_URL은 https://로 시작해야 합니다.');
  }

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * 환경변수 검증 및 에러 발생
 * 애플리케이션 시작 시 호출하여 필수 환경변수가 없으면 즉시 종료
 */
export function requireEnv(): void {
  const result = validateEnv();

  if (!result.isValid) {
    console.error('❌ 환경변수 검증 실패:\n');

    if (result.missing.length > 0) {
      console.error('누락된 필수 환경변수:');
      result.missing.forEach((env) => {
        console.error(`  - ${env}`);
      });
      console.error('');
    }

    if (result.errors.length > 0) {
      console.error('환경변수 형식 오류:');
      result.errors.forEach((error) => {
        console.error(`  - ${error}`);
      });
      console.error('');
    }

    console.error('💡 해결 방법:');
    console.error('  1. .env.example 파일을 .env로 복사하세요');
    console.error('  2. .env 파일에 실제 값을 입력하세요');
    console.error('  3. PRISMA_SETUP.md 문서를 참고하세요\n');

    process.exit(1);
  }
}

/**
 * 타입 안전한 환경변수 접근
 */
export const env = {
  // 데이터베이스
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL || '';
  },
  get DIRECT_URL(): string {
    return process.env.DIRECT_URL || '';
  },

  // Supabase
  get SUPABASE_URL(): string {
    return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  },
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  },
  get SUPABASE_ANON_KEY(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  },

  // 애플리케이션
  get PORT(): number {
    return parseInt(process.env.PORT || OPTIONAL_ENV_VARS.PORT, 10);
  },
  get FRONTEND_URL(): string {
    return process.env.FRONTEND_URL || OPTIONAL_ENV_VARS.FRONTEND_URL;
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || OPTIONAL_ENV_VARS.NODE_ENV;
  },

  // 유틸리티
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  },
} as const;
