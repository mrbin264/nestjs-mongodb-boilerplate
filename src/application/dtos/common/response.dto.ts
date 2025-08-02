import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  readonly success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation successful',
  })
  readonly message: string;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  readonly data: T | undefined;

  @ApiProperty({
    description: 'Response timestamp in ISO format',
    example: '2024-01-15T10:30:00.000Z',
  })
  readonly timestamp: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'Operation successful'): ResponseDto<T> {
    return new ResponseDto(true, message, data);
  }

  static error(message: string): ResponseDto<null> {
    return new ResponseDto(false, message);
  }
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: false,
    default: false,
  })
  readonly success: boolean = false;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  readonly message: string;

  @ApiProperty({
    description: 'Error type or code',
    example: 'Bad Request',
  })
  readonly error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  readonly statusCode: number;

  @ApiProperty({
    description: 'Error timestamp in ISO format',
    example: '2024-01-15T10:30:00.000Z',
  })
  readonly timestamp: string;

  @ApiProperty({
    description: 'Request path where the error occurred',
    example: '/api/auth/login',
    required: false,
  })
  readonly path: string | undefined;

  constructor(message: string, error: string, statusCode: number, path?: string) {
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
    this.path = path;
    this.timestamp = new Date().toISOString();
  }
}
