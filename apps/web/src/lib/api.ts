/**
 * API 클라이언트 유틸리티
 * 백엔드 API와 통신하기 위한 함수들
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 공통 fetch 함수
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || `API Error: ${response.status}`,
      data
    );
  }

  return data;
}

// ============================================
// 메뉴 API
// ============================================

import type { MenuListResponse, MenuResponse } from '@qr-smart-order/shared-types';

export const menuApi = {
  /**
   * 메뉴 목록 조회
   * @param includeSoldOut 품절 메뉴 포함 여부
   */
  getAll: (includeSoldOut = false) =>
    fetchApi<MenuListResponse>(`/menus?includeSoldOut=${includeSoldOut}`),

  /**
   * 메뉴 단일 조회
   * @param id 메뉴 ID
   */
  getById: (id: string) => fetchApi<MenuResponse>(`/menus/${id}`),
};

// ============================================
// 주문 API
// ============================================

import type {
  OrderResponse,
  OrderListResponse,
  OrderStatusResponse,
} from '@qr-smart-order/shared-types';

export const orderApi = {
  /**
   * 주문 생성
   * @param items 주문 항목 배열
   */
  create: (items: { menuId: string; quantity: number }[]) =>
    fetchApi<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  /**
   * 주문 목록 조회
   * @param status 상태 필터 (선택)
   */
  getAll: (status?: string[]) => {
    const params = status?.map((s) => `status=${s}`).join('&') || '';
    return fetchApi<OrderListResponse>(`/orders${params ? `?${params}` : ''}`);
  },

  /**
   * 주문 단일 조회
   * @param id 주문 ID
   */
  getById: (id: string) => fetchApi<OrderResponse>(`/orders/${id}`),

  /**
   * 주문 상태 변경
   * @param id 주문 ID
   * @param status 새로운 상태
   */
  updateStatus: (id: string, status: string) =>
    fetchApi<OrderStatusResponse>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
