import { UsePipes } from "@nestjs/common";
import type { ZodSchema } from "zod";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

/**
 * Zod 스키마를 사용하여 요청 데이터를 검증하는 데코레이터
 *
 * @example
 * @ZodValidation(CreateOrderRequestSchema)
 * async create(@Body() body: CreateOrderRequest) { ... }
 */
export const ZodValidation = (schema: ZodSchema) => {
  return UsePipes(new ZodValidationPipe(schema));
};
