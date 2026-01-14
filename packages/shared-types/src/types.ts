import { z } from 'zod';

// Menu types
export const MenuSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  price: z.number().int().positive().max(1000000), 
  imageUrl: z.string().url().nullable().optional(),
  isSoldOut: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Menu = z.infer<typeof MenuSchema>;

// Order types
export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
}

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  menuId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.number().int().positive(),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
  totalPrice: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // 관계 데이터 (선택적)
  items: z.array(OrderItemSchema).optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
