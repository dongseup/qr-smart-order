import { z } from 'zod';
import type { PaginationMeta } from './types';

// ============================================
// 페이지네이션 유틸리티
// ============================================

/**
 * 페이지네이션 파라미터 타입
 */
export type PaginationParams = {
  limit?: number;
  offset?: number;
};

/**
 * 페이지 번호와 페이지 크기로부터 offset과 limit을 계산합니다.
 * @param page - 페이지 번호 (1부터 시작)
 * @param limit - 페이지당 항목 수
 * @returns 계산된 offset과 limit
 * @example
 * calculatePagination(2, 10) // { offset: 10, limit: 10 }
 */
export function calculatePagination(
  page: number,
  limit: number
): { offset: number; limit: number } {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.max(1, Math.min(100, limit));
  return {
    offset: (normalizedPage - 1) * normalizedLimit,
    limit: normalizedLimit,
  };
}

/**
 * 페이지네이션 메타데이터를 생성합니다.
 * @param total - 전체 항목 수
 * @param limit - 페이지당 항목 수
 * @param offset - 현재 오프셋
 * @returns 페이지네이션 메타데이터
 * @example
 * createPaginationMeta(100, 10, 0) // { total: 100, limit: 10, offset: 0, hasMore: true }
 */
export function createPaginationMeta(
  total: number,
  limit: number,
  offset: number
): PaginationMeta {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

// ============================================
// 정렬 유틸리티
// ============================================

/**
 * 정렬 방향 타입
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 정렬 파라미터 타입
 */
export type SortParams<T extends string> = {
  sortBy?: T;
  sortOrder?: SortOrder;
};

/**
 * 문자열로부터 정렬 파라미터를 파싱합니다.
 * @param sortBy - 정렬할 필드명
 * @param sortOrder - 정렬 방향 ('asc' 또는 'desc')
 * @returns 파싱된 정렬 파라미터 또는 undefined
 * @example
 * parseSortParams('createdAt', 'desc') // { sortBy: 'createdAt', sortOrder: 'desc' }
 */
export function parseSortParams<T extends string>(
  sortBy?: string,
  sortOrder?: string
): SortParams<T> | undefined {
  if (!sortBy) return undefined;

  const normalizedOrder = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';
  return {
    sortBy: sortBy as T,
    sortOrder: normalizedOrder,
  };
}

// ============================================
// 필터링 유틸리티
// ============================================

/**
 * 날짜 범위 필터 타입
 */
export type DateRangeFilter = {
  startDate?: string;
  endDate?: string;
};

/**
 * 숫자 범위 필터 타입
 */
export type NumberRangeFilter = {
  min?: number;
  max?: number;
};

/**
 * 날짜 범위 필터를 검증하고 정규화합니다.
 * @param startDate - 시작 날짜 (ISO 8601 형식)
 * @param endDate - 종료 날짜 (ISO 8601 형식)
 * @returns 검증된 날짜 범위 필터 또는 undefined
 * @example
 * validateDateRange('2024-01-01', '2024-01-31')
 */
export function validateDateRange(
  startDate?: string,
  endDate?: string
): DateRangeFilter | undefined {
  if (!startDate && !endDate) return undefined;

  const result: DateRangeFilter = {};
  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      result.startDate = start.toISOString();
    }
  }
  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      result.endDate = end.toISOString();
    }
  }

  // 시작일이 종료일보다 늦으면 undefined 반환
  if (result.startDate && result.endDate) {
    if (new Date(result.startDate) > new Date(result.endDate)) {
      return undefined;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * 숫자 범위 필터를 검증하고 정규화합니다.
 * @param min - 최소값
 * @param max - 최대값
 * @returns 검증된 숫자 범위 필터 또는 undefined
 * @example
 * validateNumberRange(0, 100)
 */
export function validateNumberRange(
  min?: number,
  max?: number
): NumberRangeFilter | undefined {
  if (min === undefined && max === undefined) return undefined;

  const result: NumberRangeFilter = {};
  if (min !== undefined && !isNaN(min)) {
    result.min = min;
  }
  if (max !== undefined && !isNaN(max)) {
    result.max = max;
  }

  // 최소값이 최대값보다 크면 undefined 반환
  if (result.min !== undefined && result.max !== undefined) {
    if (result.min > result.max) {
      return undefined;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// ============================================
// 타입 변환 유틸리티
// ============================================

/**
 * 데이터를 그대로 반환합니다 (타입 변환 헬퍼로 사용).
 * Prisma 모델이나 다른 데이터 소스에서 API 응답 형식으로 변환할 때 사용합니다.
 * @param data - 변환할 데이터
 * @returns 동일한 데이터
 * @example
 * toApiResponse(prismaMenu) // Menu 타입으로 변환
 */
export function toApiResponse<T>(data: T): T {
  return data;
}

/**
 * Date 객체나 ISO 문자열을 ISO 8601 형식의 문자열로 변환합니다.
 * @param date - 변환할 날짜 (Date 객체 또는 ISO 문자열)
 * @returns ISO 8601 형식의 날짜 문자열
 * @example
 * formatDateTime(new Date()) // "2024-01-15T10:30:00.000Z"
 * formatDateTime("2024-01-15T10:30:00Z") // "2024-01-15T10:30:00.000Z"
 */
export function formatDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${date}`);
    }
    return parsed.toISOString();
  }
  return date.toISOString();
}

/**
 * UUID 형식이 유효한지 검증합니다.
 * @param uuid - 검증할 UUID 문자열
 * @returns 유효한 UUID인지 여부
 * @example
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isValidUUID('invalid-uuid') // false
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================
// 스키마 검증 유틸리티
// ============================================

/**
 * Zod 스키마를 사용하여 데이터를 안전하게 파싱합니다.
 * 에러가 발생해도 예외를 던지지 않고 결과를 반환합니다.
 * @param schema - 검증할 Zod 스키마
 * @param data - 검증할 데이터
 * @returns 성공 시 데이터, 실패 시 에러 정보
 * @example
 * const result = safeParse(MenuSchema, menuData);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Zod 스키마를 사용하여 데이터가 유효한지 확인하는 타입 가드입니다.
 * @param schema - 검증할 Zod 스키마
 * @param data - 검증할 데이터
 * @returns 데이터가 유효한지 여부 (타입 가드)
 * @example
 * if (isValid(MenuSchema, unknownData)) {
 *   // 이 블록에서 unknownData는 Menu 타입으로 추론됩니다
 *   console.log(unknownData.name);
 * }
 */
export function isValid<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): data is T {
  return schema.safeParse(data).success;
}

/**
 * Zod 스키마를 사용하여 데이터를 검증하고 변환합니다.
 * 검증 실패 시 예외를 던집니다.
 * @param schema - 검증할 Zod 스키마
 * @param data - 검증할 데이터
 * @returns 검증된 데이터
 * @throws ZodError - 검증 실패 시
 * @example
 * try {
 *   const menu = parseSchema(MenuSchema, menuData);
 *   console.log(menu.name);
 * } catch (error) {
 *   console.error('Validation failed:', error);
 * }
 */
export function parseSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// ============================================
// 기타 유틸리티
// ============================================

/**
 * 객체에서 undefined 값을 제거합니다.
 * @param obj - 정리할 객체
 * @returns undefined 값이 제거된 객체
 * @example
 * removeUndefined({ a: 1, b: undefined, c: 2 }) // { a: 1, c: 2 }
 */
export function removeUndefined<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 두 날짜 사이의 경과 시간을 밀리초 단위로 계산합니다.
 * @param startDate - 시작 날짜
 * @param endDate - 종료 날짜 (기본값: 현재 시간)
 * @returns 경과 시간 (밀리초)
 * @example
 * getElapsedTime(new Date('2024-01-01'), new Date('2024-01-02')) // 86400000
 */
export function getElapsedTime(
  startDate: Date | string,
  endDate?: Date | string
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = endDate
    ? typeof endDate === 'string'
      ? new Date(endDate)
      : endDate
    : new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date provided');
  }

  return end.getTime() - start.getTime();
}

/**
 * 경과 시간을 사람이 읽기 쉬운 형식으로 변환합니다.
 * @param milliseconds - 경과 시간 (밀리초)
 * @returns 포맷된 시간 문자열
 * @example
 * formatElapsedTime(125000) // "2분 5초"
 * formatElapsedTime(3600000) // "1시간"
 */
export function formatElapsedTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
  }
  return `${seconds}초`;
}
