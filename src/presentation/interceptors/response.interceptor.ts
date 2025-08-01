import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    // Generate request ID if not present
    const requestId = request.headers['x-request-id'] || this.generateRequestId();

    return next.handle().pipe(
      map(data => {
        // If data is already a ResponseDto, use it directly
        if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
          return {
            ...data,
            requestId,
          } as StandardResponse<T>;
        }

        // Create standardized response
        return {
          success: true,
          message: 'Operation successful',
          data,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
