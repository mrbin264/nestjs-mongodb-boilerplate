// Test fixtures for API responses and error scenarios
export class ApiFixtures {
  /**
   * Standard success response format
   */
  static successResponse<T>(data: T) {
    return {
      success: true,
      data,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Standard error response format
   */
  static errorResponse(message: string, statusCode: number = 400, error?: string) {
    return {
      success: false,
      error: error || 'Bad Request',
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validation error response format
   */
  static validationErrorResponse(errors: string[]) {
    return {
      success: false,
      error: 'Validation Error',
      message: 'Input validation failed',
      statusCode: 400,
      details: errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Paginated response format
   */
  static paginatedResponse<T>(data: T[], page: number = 1, limit: number = 10, total: number = 0) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Common HTTP status codes for testing
   */
  static httpStatusCodes = {
    // Success
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    
    // Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    
    // Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
  };

  /**
   * Common error messages
   */
  static errorMessages = {
    // Authentication
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Insufficient permissions',
    
    // User management
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User with this email already exists',
    USER_INACTIVE: 'User account is inactive',
    EMAIL_NOT_VERIFIED: 'Email address not verified',
    
    // Validation
    INVALID_EMAIL: 'Invalid email address',
    WEAK_PASSWORD: 'Password does not meet security requirements',
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid data format',
    
    // General
    INTERNAL_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    METHOD_NOT_ALLOWED: 'Method not allowed',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  };

  /**
   * Test request headers
   */
  static requestHeaders = {
    json: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    formData: {
      'Content-Type': 'multipart/form-data',
    },
    urlEncoded: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    withAuth: (token: string) => ({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    }),
    withCors: (origin: string) => ({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': origin,
    }),
  };

  /**
   * Mock request bodies for different content types
   */
  static requestBodies = {
    validJson: { test: 'data' },
    invalidJson: '{ invalid json }',
    oversizedJson: { data: 'x'.repeat(10000) },
    emptyJson: {},
    nullValues: { field: null },
    undefinedValues: { field: undefined },
  };

  /**
   * Database error scenarios
   */
  static databaseErrors = {
    connectionTimeout: {
      name: 'MongooseError',
      message: 'Connection timeout',
    },
    duplicateKey: {
      name: 'MongoError',
      code: 11000,
      message: 'Duplicate key error',
    },
    validationError: {
      name: 'ValidationError',
      message: 'Validation failed',
    },
    networkError: {
      name: 'MongoNetworkError',
      message: 'Network error occurred',
    },
  };

  /**
   * Rate limiting scenarios
   */
  static rateLimitingScenarios = {
    withinLimit: {
      requestCount: 5,
      timeWindow: 60000,
      expected: 200,
    },
    exceedsLimit: {
      requestCount: 11,
      timeWindow: 60000,
      expected: 429,
    },
    afterReset: {
      requestCount: 5,
      timeWindow: 0, // Simulate time passage
      expected: 200,
    },
  };

  /**
   * Security test scenarios
   */
  static securityScenarios = {
    csrf: {
      headers: {
        'Origin': 'https://malicious-site.com',
        'Referer': 'https://malicious-site.com/attack',
      },
      expected: 403,
    },
    xss: {
      payload: '<script>alert("xss")</script>',
      expected: 400,
    },
    sqlInjection: {
      payload: "'; DROP TABLE users; --",
      expected: 400,
    },
    oversizedPayload: {
      payload: 'x'.repeat(100000),
      expected: 413,
    },
  };

  /**
   * Performance test scenarios
   */
  static performanceScenarios = {
    concurrent: {
      requestCount: 100,
      concurrency: 10,
      maxResponseTime: 1000,
    },
    stress: {
      requestCount: 1000,
      concurrency: 50,
      maxResponseTime: 2000,
    },
    load: {
      requestCount: 500,
      concurrency: 25,
      maxResponseTime: 1500,
    },
  };

  /**
   * Test environment configurations
   */
  static testEnvironments = {
    unit: {
      database: 'memory',
      externalServices: 'mocked',
      logging: 'minimal',
    },
    integration: {
      database: 'mongodb-memory-server',
      externalServices: 'mocked',
      logging: 'standard',
    },
    e2e: {
      database: 'mongodb-memory-server',
      externalServices: 'real',
      logging: 'verbose',
    },
  };

  /**
   * Mock external service responses
   */
  static externalServiceMocks = {
    emailService: {
      success: { messageId: 'mock-message-id', status: 'sent' },
      failure: { error: 'Email service unavailable' },
    },
    smsService: {
      success: { messageId: 'mock-sms-id', status: 'delivered' },
      failure: { error: 'SMS service unavailable' },
    },
    paymentService: {
      success: { transactionId: 'mock-transaction-id', status: 'completed' },
      failure: { error: 'Payment processing failed' },
    },
  };

  /**
   * Timeout scenarios for testing
   */
  static timeoutScenarios = {
    short: 100,
    medium: 1000,
    long: 5000,
    veryLong: 30000,
  };

  /**
   * Memory usage test data
   */
  static memoryTestData = {
    small: Array.from({ length: 100 }, (_, i) => ({ id: i, data: `test-${i}` })),
    medium: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `test-${i}` })),
    large: Array.from({ length: 10000 }, (_, i) => ({ id: i, data: `test-${i}` })),
  };
}
