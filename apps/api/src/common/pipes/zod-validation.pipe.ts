import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod 검증 에러를 NestJS BadRequestException으로 변환
        const errorMessages = error.errors.map((err) => {
          const path = err.path.join(".");
          return path ? `${path}: ${err.message}` : err.message;
        });

        throw new BadRequestException({
          message: "요청 데이터 검증 실패",
          errors: errorMessages,
          details: error.errors,
        });
      }
      // 예상치 못한 에러
      throw new BadRequestException("요청 데이터 검증 중 오류가 발생했습니다.");
    }
  }
}
