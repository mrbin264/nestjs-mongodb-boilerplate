import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

interface ValidationExceptionResponse {
  success: boolean;
  message: string;
  errors: ValidationErrorDetail[];
  statusCode: number;
  timestamp: string;
  path: string;
}

interface ValidationErrorDetail {
  field: string;
  value: unknown;
  constraints: Record<string, string>;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let validationErrors: ValidationErrorDetail[] = [];

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      
      if (Array.isArray(responseObj.message)) {
        validationErrors = this.extractValidationErrors(responseObj.message);
      }
    }

    const errorResponse: ValidationExceptionResponse = {
      success: false,
      message: validationErrors.length > 0 
        ? 'Validation failed' 
        : exception.message,
      errors: validationErrors,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.warn(
      `Validation error: ${JSON.stringify(validationErrors)}`,
      `${request.method} ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }

  private extractValidationErrors(errors: unknown[]): ValidationErrorDetail[] {
    const validationErrors: ValidationErrorDetail[] = [];

    for (const error of errors) {
      if (this.isValidationError(error)) {
        validationErrors.push({
          field: error.property,
          value: error.value,
          constraints: error.constraints || {},
        });

        // Handle nested validation errors
        if (error.children && error.children.length > 0) {
          const nestedErrors = this.extractNestedErrors(error.children, error.property);
          validationErrors.push(...nestedErrors);
        }
      } else if (typeof error === 'string') {
        // Handle simple string error messages
        validationErrors.push({
          field: 'unknown',
          value: undefined,
          constraints: { error },
        });
      }
    }

    return validationErrors;
  }

  private extractNestedErrors(children: ValidationError[], parentProperty: string): ValidationErrorDetail[] {
    const nestedErrors: ValidationErrorDetail[] = [];

    for (const child of children) {
      const fieldPath = `${parentProperty}.${child.property}`;
      
      if (child.constraints) {
        nestedErrors.push({
          field: fieldPath,
          value: child.value,
          constraints: child.constraints,
        });
      }

      if (child.children && child.children.length > 0) {
        const deeperErrors = this.extractNestedErrors(child.children, fieldPath);
        nestedErrors.push(...deeperErrors);
      }
    }

    return nestedErrors;
  }

  private isValidationError(error: unknown): error is ValidationError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'property' in error &&
      typeof (error as ValidationError).property === 'string'
    );
  }
}
