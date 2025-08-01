// Test fixtures for Authentication flows and token data
export class AuthFixtures {
  /**
   * Valid registration data
   */
  static validRegistration() {
    return {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User',
    };
  }

  /**
   * Invalid registration data for validation testing
   */
  static invalidRegistrations() {
    return [
      {
        email: 'invalid-email',
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
      },
      {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      },
      {
        email: 'test@example.com',
        password: 'ValidPassword123!',
        firstName: '',
        lastName: 'User',
      },
      {
        email: 'test@example.com',
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: '',
      },
      {
        // Missing required fields
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
      },
    ];
  }

  /**
   * Valid login credentials
   */
  static validLogin() {
    return {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };
  }

  /**
   * Invalid login credentials
   */
  static invalidLogins() {
    return [
      {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      },
      {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      },
      {
        email: 'invalid-email',
        password: 'TestPassword123!',
      },
      {
        email: '',
        password: 'TestPassword123!',
      },
      {
        email: 'test@example.com',
        password: '',
      },
    ];
  }

  /**
   * Password reset request data
   */
  static passwordResetRequest() {
    return {
      email: 'test@example.com',
    };
  }

  /**
   * Invalid password reset requests
   */
  static invalidPasswordResetRequests() {
    return [
      { email: 'invalid-email' },
      { email: '' },
      { email: 'nonexistent@example.com' }, // Should still return 200 for security
    ];
  }

  /**
   * Password reset data with token
   */
  static passwordReset() {
    return {
      token: 'valid-reset-token-here',
      newPassword: 'NewPassword456!',
    };
  }

  /**
   * Invalid password reset data
   */
  static invalidPasswordResets() {
    return [
      {
        token: 'invalid-token',
        newPassword: 'NewPassword456!',
      },
      {
        token: 'expired-token',
        newPassword: 'NewPassword456!',
      },
      {
        token: 'valid-reset-token-here',
        newPassword: 'weak',
      },
      {
        token: '',
        newPassword: 'NewPassword456!',
      },
      {
        token: 'valid-reset-token-here',
        newPassword: '',
      },
    ];
  }

  /**
   * Email verification data
   */
  static emailVerification() {
    return {
      token: 'valid-verification-token-here',
    };
  }

  /**
   * Invalid email verification data
   */
  static invalidEmailVerifications() {
    return [
      { token: 'invalid-token' },
      { token: 'expired-token' },
      { token: '' },
      { token: 'already-used-token' },
    ];
  }

  /**
   * Refresh token data
   */
  static refreshToken() {
    return {
      refresh_token: 'valid-refresh-token-here',
    };
  }

  /**
   * Invalid refresh token data
   */
  static invalidRefreshTokens() {
    return [
      { refresh_token: 'invalid-token' },
      { refresh_token: 'expired-token' },
      { refresh_token: '' },
      { refresh_token: 'revoked-token' },
    ];
  }

  /**
   * Logout data
   */
  static logout() {
    return {
      refresh_token: 'valid-refresh-token-here',
    };
  }

  /**
   * JWT payload for testing
   */
  static jwtPayload() {
    return {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      roles: ['user'],
      emailVerified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    };
  }

  /**
   * Expired JWT payload
   */
  static expiredJwtPayload() {
    return {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      roles: ['user'],
      emailVerified: true,
      iat: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
      exp: Math.floor(Date.now() / 1000) - 900,  // 15 minutes ago (expired)
    };
  }

  /**
   * Token response format
   */
  static tokenResponse() {
    return {
      access_token: 'jwt-access-token-here',
      refresh_token: 'refresh-token-here',
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['user'],
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
        emailVerified: true,
        isActive: true,
      },
    };
  }

  /**
   * Rate limiting test data
   */
  static rateLimitingData() {
    return {
      maxAttempts: 5,
      timeWindow: 60000, // 1 minute
      testCredentials: Array.from({ length: 10 }, (_, i) => ({
        email: 'test@example.com',
        password: `WrongPassword${i}!`,
      })),
    };
  }

  /**
   * Security test payloads
   */
  static securityTestPayloads() {
    return {
      sqlInjection: [
        { email: "'; DROP TABLE users; --", password: 'password' },
        { email: "admin@example.com' OR '1'='1", password: 'password' },
      ],
      xssAttempts: [
        { email: '<script>alert("xss")</script>@example.com', password: 'password' },
        { firstName: '<img src=x onerror=alert(1)>', lastName: 'User' },
      ],
      oversizedPayloads: [
        { email: 'a'.repeat(1000) + '@example.com', password: 'password' },
        { firstName: 'a'.repeat(1000), lastName: 'User' },
      ],
    };
  }

  /**
   * Authentication headers for testing
   */
  static authHeaders() {
    return {
      validBearer: 'Bearer valid-jwt-token-here',
      invalidBearer: 'Bearer invalid-jwt-token-here',
      expiredBearer: 'Bearer expired-jwt-token-here',
      malformedHeader: 'InvalidFormat token-here',
      emptyBearer: 'Bearer ',
    };
  }

  /**
   * CORS test origins
   */
  static corsTestOrigins() {
    return [
      'http://localhost:3000',
      'https://example.com',
      'https://malicious-site.com',
      'null',
      '',
    ];
  }
}
