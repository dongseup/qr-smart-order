/**
 * 에러 처리 유틸리티 함수
 * API 에러를 사용자 친화적인 메시지로 변환
 */

import { ApiError } from "./api";

/**
 * 에러 타입
 */
export type ErrorType = "network" | "server" | "client" | "unknown";

/**
 * 에러 정보 인터페이스
 */
export interface ErrorInfo {
  message: string;
  type: ErrorType;
  canRetry: boolean;
  statusCode?: number;
}

/**
 * HTTP 상태 코드를 에러 타입으로 변환
 */
function getErrorType(statusCode?: number): ErrorType {
  if (!statusCode) return "unknown";

  if (statusCode >= 500) return "server";
  if (statusCode >= 400) return "client";
  return "network";
}

/**
 * 에러가 재시도 가능한지 확인
 */
function canRetryError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // 5xx 서버 에러는 재시도 가능
    if (error.statusCode >= 500) return true;
    // 네트워크 에러는 재시도 가능
    if (error.statusCode === 0 || error.statusCode >= 500) return true;
  }

  // 일반 에러는 네트워크 관련이면 재시도 가능
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout")
    );
  }

  return false;
}

/**
 * 에러를 사용자 친화적인 메시지로 변환
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // API 에러는 서버에서 제공한 메시지 사용
    if (error.message) {
      return error.message;
    }

    // 상태 코드별 기본 메시지
    switch (error.statusCode) {
      case 400:
        return "잘못된 요청입니다. 입력 정보를 확인해주세요.";
      case 401:
        return "인증이 필요합니다.";
      case 403:
        return "접근 권한이 없습니다.";
      case 404:
        return "요청한 정보를 찾을 수 없습니다.";
      case 409:
        return "이미 처리된 요청입니다.";
      case 429:
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      case 500:
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      case 502:
      case 503:
        return "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
      case 504:
        return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
      default:
        return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
  }

  if (error instanceof Error) {
    // 네트워크 에러 감지
    if (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch")
    ) {
      return "네트워크 연결을 확인해주세요.";
    }

    if (error.message.includes("timeout")) {
      return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }

    return error.message || "알 수 없는 오류가 발생했습니다.";
  }

  return "알 수 없는 오류가 발생했습니다.";
}

/**
 * 에러 정보 추출
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  const statusCode = error instanceof ApiError ? error.statusCode : undefined;
  const type = getErrorType(statusCode);
  const message = formatErrorMessage(error);
  const canRetry = canRetryError(error);

  return {
    message,
    type,
    canRetry,
    statusCode,
  };
}
