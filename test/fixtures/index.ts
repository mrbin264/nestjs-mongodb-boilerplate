import { UserFixtures } from './user.fixtures';
import { AuthFixtures } from './auth.fixtures';
import { ApiFixtures } from './api.fixtures';

/**
 * Central export for all test fixtures
 * Provides a single import point for all test data
 */
export { UserFixtures, AuthFixtures, ApiFixtures };

/**
 * Combined fixtures for complex test scenarios
 */
export class CombinedFixtures {
  /**
   * Complete user registration flow test data
   */
  static userRegistrationFlow() {
    return {
      registration: AuthFixtures.validRegistration(),
      expectedUser: UserFixtures.createUsers(1)[0],
      expectedResponse: ApiFixtures.successResponse({
        user: UserFixtures.userWithProfile(),
        token: AuthFixtures.tokenResponse(),
      }),
    };
  }

  /**
   * Complete user login flow test data
   */
  static userLoginFlow() {
    return {
      existingUser: UserFixtures.userWithProfile(),
      loginCredentials: AuthFixtures.validLogin(),
      expectedResponse: ApiFixtures.successResponse(AuthFixtures.tokenResponse()),
    };
  }

  /**
   * Password reset flow test data
   */
  static passwordResetFlow() {
    return {
      existingUser: UserFixtures.userWithProfile(),
      resetRequest: AuthFixtures.passwordResetRequest(),
      resetData: AuthFixtures.passwordReset(),
      updatedUser: UserFixtures.userWithProfile(),
      expectedResponses: {
        request: ApiFixtures.successResponse({ message: 'Password reset email sent' }),
        reset: ApiFixtures.successResponse({ message: 'Password updated successfully' }),
      },
    };
  }

  /**
   * User profile update flow test data
   */
  static userProfileUpdateFlow() {
    return {
      existingUser: UserFixtures.userWithProfile(),
      updateData: UserFixtures.updateData(),
      updatedUser: UserFixtures.userWithProfile(),
      expectedResponse: ApiFixtures.successResponse(UserFixtures.userWithProfile()),
    };
  }

  /**
   * Admin user management flow test data
   */
  static adminUserManagementFlow() {
    return {
      adminUser: UserFixtures.adminUser(),
      targetUser: UserFixtures.userWithProfile(),
      updateData: UserFixtures.updateData(),
      expectedResponse: ApiFixtures.successResponse(UserFixtures.userWithProfile()),
    };
  }

  /**
   * User search and pagination flow test data
   */
  static userSearchFlow() {
    return {
      users: UserFixtures.createUsers(10),
      searchQuery: UserFixtures.searchQueries()[0],
      paginationParams: { page: 1, limit: 10 },
      expectedResponse: ApiFixtures.paginatedResponse(
        UserFixtures.createUsers(10),
        1,
        10,
        10,
      ),
    };
  }

  /**
   * Authentication error scenarios
   */
  static authErrorScenarios() {
    return {
      invalidCredentials: {
        input: AuthFixtures.invalidLogins()[0],
        expectedResponse: ApiFixtures.errorResponse(
          ApiFixtures.errorMessages.INVALID_CREDENTIALS,
          ApiFixtures.httpStatusCodes.UNAUTHORIZED,
        ),
      },
      expiredToken: {
        input: AuthFixtures.authHeaders().expiredBearer,
        expectedResponse: ApiFixtures.errorResponse(
          ApiFixtures.errorMessages.TOKEN_EXPIRED,
          ApiFixtures.httpStatusCodes.UNAUTHORIZED,
        ),
      },
      insufficientPermissions: {
        user: UserFixtures.userWithProfile(),
        expectedResponse: ApiFixtures.errorResponse(
          ApiFixtures.errorMessages.FORBIDDEN,
          ApiFixtures.httpStatusCodes.FORBIDDEN,
        ),
      },
    };
  }

  /**
   * Validation error scenarios
   */
  static validationErrorScenarios() {
    return {
      invalidEmail: {
        input: AuthFixtures.invalidRegistrations()[0],
        expectedResponse: ApiFixtures.validationErrorResponse([
          ApiFixtures.errorMessages.INVALID_EMAIL,
        ]),
      },
      weakPassword: {
        input: AuthFixtures.invalidRegistrations()[1],
        expectedResponse: ApiFixtures.validationErrorResponse([
          ApiFixtures.errorMessages.WEAK_PASSWORD,
        ]),
      },
      missingFields: {
        input: AuthFixtures.invalidRegistrations()[4],
        expectedResponse: ApiFixtures.validationErrorResponse([
          ApiFixtures.errorMessages.REQUIRED_FIELD,
        ]),
      },
    };
  }

  /**
   * Rate limiting test scenarios
   */
  static rateLimitingScenarios() {
    return {
      withinLimit: {
        requests: AuthFixtures.rateLimitingData().testCredentials.slice(0, 3),
        expectedStatus: ApiFixtures.httpStatusCodes.UNAUTHORIZED, // Wrong credentials
      },
      exceedsLimit: {
        requests: AuthFixtures.rateLimitingData().testCredentials,
        expectedStatus: ApiFixtures.httpStatusCodes.TOO_MANY_REQUESTS,
        expectedResponse: ApiFixtures.errorResponse(
          ApiFixtures.errorMessages.RATE_LIMIT_EXCEEDED,
          ApiFixtures.httpStatusCodes.TOO_MANY_REQUESTS,
        ),
      },
    };
  }

  /**
   * Security test scenarios
   */
  static securityTestScenarios() {
    return {
      sqlInjection: {
        inputs: AuthFixtures.securityTestPayloads().sqlInjection,
        expectedStatus: ApiFixtures.httpStatusCodes.BAD_REQUEST,
      },
      xssAttempts: {
        inputs: AuthFixtures.securityTestPayloads().xssAttempts,
        expectedStatus: ApiFixtures.httpStatusCodes.BAD_REQUEST,
      },
      corsViolation: {
        origins: AuthFixtures.corsTestOrigins(),
        expectedStatus: ApiFixtures.httpStatusCodes.FORBIDDEN,
      },
    };
  }

  /**
   * Database error simulation scenarios
   */
  static databaseErrorScenarios() {
    return {
      connectionTimeout: {
        error: ApiFixtures.databaseErrors.connectionTimeout,
        expectedResponse: ApiFixtures.errorResponse(
          ApiFixtures.errorMessages.INTERNAL_ERROR,
          ApiFixtures.httpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      },
      duplicateKey: {
        error: ApiFixtures.databaseErrors.duplicateKey,
        expectedResponse: ApiFixtures.errorResponse(
          ApiFixtures.errorMessages.USER_ALREADY_EXISTS,
          ApiFixtures.httpStatusCodes.CONFLICT,
        ),
      },
      validationError: {
        error: ApiFixtures.databaseErrors.validationError,
        expectedResponse: ApiFixtures.errorResponse(
          ApiFixtures.errorMessages.INVALID_FORMAT,
          ApiFixtures.httpStatusCodes.BAD_REQUEST,
        ),
      },
    };
  }

  /**
   * Performance test scenarios
   */
  static performanceTestScenarios() {
    return {
      concurrentUsers: {
        userCount: 50,
        users: UserFixtures.createUsers(50),
        loginRequests: Array.from({ length: 50 }, (_, i) => ({
          email: `user${i}@example.com`,
          password: 'TestPassword123!',
        })),
      },
      bulkOperations: {
        createUsers: UserFixtures.createUsers(100),
        updateUsers: Array.from({ length: 100 }, () => 
          UserFixtures.updateData()
        ),
      },
    };
  }

  /**
   * Integration test scenarios combining multiple services
   */
  static integrationTestScenarios() {
    return {
      userLifecycle: {
        steps: [
          { action: 'register', data: AuthFixtures.validRegistration() },
          { action: 'verify', data: AuthFixtures.emailVerification() },
          { action: 'login', data: AuthFixtures.validLogin() },
          { action: 'updateProfile', data: UserFixtures.profileUpdateData() },
          { action: 'changePassword', data: UserFixtures.passwordChangeData() },
          { action: 'logout', data: AuthFixtures.logout() },
        ],
      },
      roleBasedAccess: {
        users: [
          UserFixtures.userWithProfile(),
          UserFixtures.adminUser(),
          UserFixtures.inactiveUser(),
        ],
        endpoints: [
          { path: '/api/users/profile', method: 'GET', roles: ['user', 'admin'] },
          { path: '/api/users', method: 'GET', roles: ['admin'] },
          { path: '/api/users/:id', method: 'DELETE', roles: ['admin'] },
        ],
      },
    };
  }
}
