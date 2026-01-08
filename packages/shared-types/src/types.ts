import { z } from 'zod';

// Menu types
export const MenuSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  price: z.number().int().positive().max(1000000), 
  imageUrl: z.string().url().optional(),
  isSoldOut: z.boolean().default(false),
  createdAt: z.string().datetime(),
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
  menuId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().int().positive(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.number().int().positive(),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
  items: z.array(OrderItemSchema),
  totalPrice: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
