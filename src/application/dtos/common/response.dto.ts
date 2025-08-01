export class ResponseDto<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T | undefined;
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
  readonly success: boolean = false;
  readonly message: string;
  readonly error: string;
  readonly statusCode: number;
  readonly timestamp: string;
  readonly path: string | undefined;

  constructor(message: string, error: string, statusCode: number, path?: string) {
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
    this.path = path;
    this.timestamp = new Date().toISOString();
  }
}
