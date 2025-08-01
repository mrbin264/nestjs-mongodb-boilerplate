import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../../application/dtos/common/response.dto';

// Domain exceptions
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { DuplicateEmailException } from '../../domain/exceptions/duplicate-email.exception';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { InvalidPasswordException } from '../../domain/exceptions/invalid-password.exception';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.constructor.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        error = (responseObj.error as string) || exception.constructor.name;
      } else {
        message = exception.message;
        error = exception.constructor.name;
      }
    } else if (this.isDomainException(exception)) {
      const mappedError = this.mapDomainExceptionToHttp(exception);
      status = mappedError.status;
      message = mappedError.message;
      error = exception.constructor.name;
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = exception.constructor.name;

      // Log the full error for debugging
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      error = 'UnknownError';

      this.logger.error(
        `Unknown exception type: ${typeof exception}`,
        JSON.stringify(exception),
        `${request.method} ${request.url}`,
      );
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error (excluding sensitive information)
    if (status >= 500) {
      this.logger.error(
        `${status} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`,
      );
    } else {
      this.logger.warn(
        `${status} ${message}`,
        `${request.method} ${request.url}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  private isDomainException(exception: unknown): exception is Error {
    return (
      exception instanceof UserNotFoundException ||
      exception instanceof DuplicateEmailException ||
      exception instanceof InvalidCredentialsException ||
      exception instanceof InvalidPasswordException ||
      exception instanceof InsufficientPermissionsException
    );
  }

  private mapDomainExceptionToHttp(exception: Error): { status: HttpStatus; message: string } {
    switch (exception.constructor) {
      case UserNotFoundException:
        return { status: HttpStatus.NOT_FOUND, message: exception.message };
      case DuplicateEmailException:
        return { status: HttpStatus.CONFLICT, message: exception.message };
      case InvalidCredentialsException:
        return { status: HttpStatus.UNAUTHORIZED, message: exception.message };
      case InvalidPasswordException:
        return { status: HttpStatus.BAD_REQUEST, message: exception.message };
      case InsufficientPermissionsException:
        return { status: HttpStatus.FORBIDDEN, message: exception.message };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
    }
  }
}
