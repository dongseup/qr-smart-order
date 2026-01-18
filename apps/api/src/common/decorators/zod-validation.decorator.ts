import { UsePipes } from "@nestjs/common";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import { ZodSchema } from "zod";

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
