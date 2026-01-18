import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ErrorResponse } from "@qr-smart-order/shared-types";
import type { Request, Response } from "express";
import { env } from "../../lib/env";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP 상태 코드 결정
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 에러 메시지 추출
    let message = "서버 오류가 발생했습니다.";
    let error: string | undefined;
    let details: any;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message || message;
        error = responseObj.error;
        details = responseObj.details || responseObj.errors;
      } else {
        message = exception.message || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      error = exception.name;
    }

    // 에러 응답 생성
    const errorResponse: ErrorResponse = {
      message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 상세 정보 추가 (개발 환경에서만)
    if (env.isDevelopment && details) {
      (errorResponse as any).details = details;
    }

    // 로깅
    if (status >= 500) {
      // 서버 에러는 에러 레벨로 로깅
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined
      );
    } else {
      // 클라이언트 에러는 경고 레벨로 로깅
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`
      );
    }

    // 응답 전송
    response.status(status).json(errorResponse);
  }
}
