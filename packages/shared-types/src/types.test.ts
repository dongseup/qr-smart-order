import { describe, it, expect } from "@jest/globals";
import {
  MenuSchema,
  OrderSchema,
  CreateMenuRequestSchema,
  CreateOrderRequestSchema,
  OrderStatus,
} from "./types";

describe("스키마 통합 테스트", () => {
  describe("MenuSchema", () => {
    it("유효한 메뉴 데이터를 검증해야 함", () => {
      const validMenu = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "아메리카노",
        price: 4500,
        isSoldOut: false,
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
      };

      expect(() => MenuSchema.parse(validMenu)).not.toThrow();
    });

    it("잘못된 메뉴 데이터를 거부해야 함", () => {
      const invalidMenu = {
        id: "invalid-uuid",
        name: "",
        price: -100,
      };

      expect(() => MenuSchema.parse(invalidMenu)).toThrow();
    });
  });

  describe("OrderSchema", () => {
    it("유효한 주문 데이터를 검증해야 함", () => {
      const validOrder = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        orderNo: 1,
        status: OrderStatus.PENDING,
        totalPrice: 9000,
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
      };

      expect(() => OrderSchema.parse(validOrder)).not.toThrow();
    });
  });

  describe("API Request Schemas", () => {
    it("CreateMenuRequestSchema가 유효한 요청을 검증해야 함", () => {
      const validRequest = {
        name: "카페라떼",
        price: 5000,
        isSoldOut: false,
      };

      expect(() => CreateMenuRequestSchema.parse(validRequest)).not.toThrow();
    });

    it("CreateOrderRequestSchema가 유효한 주문 요청을 검증해야 함", () => {
      const validRequest = {
        items: [
          {
            menuId: "550e8400-e29b-41d4-a716-446655440000",
            quantity: 2,
          },
        ],
      };

      expect(() => CreateOrderRequestSchema.parse(validRequest)).not.toThrow();
    });
  });
});
