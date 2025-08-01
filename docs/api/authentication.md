# Authentication API Guide

This guide covers the authentication and authorization endpoints provided by the Boilerplate API.

## Overview

The API uses **JWT (JSON Web Tokens)** for authentication with the following features:

- **Access Tokens**: Short-lived tokens (15 minutes) for API access
- **Refresh Tokens**: Long-lived tokens (7 days) for obtaining new access tokens
- **Role-Based Access Control (RBAC)**: Three roles: `user`, `admin`, `system_admin`
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based password recovery

## Authentication Flow

### 1. User Registration

Register a new user account.

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "message": "Registration successful. Please check your email to verify your account.",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "emailVerified": false
    }
  }
}
```

### 2. User Login

Authenticate with email and password.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "roles": ["user"],
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "emailVerified": true
    }
  }
}
```

### 3. Token Refresh

Obtain a new access token using the refresh token.

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

### 4. Password Reset Flow

#### Step 1: Request Password Reset

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset instructions sent",
  "data": {
    "message": "If an account with that email exists, we've sent password reset instructions."
  }
}
```

#### Step 2: Reset Password with Token

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "password-reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "message": "Your password has been reset successfully. Please login with your new password."
  }
}
```

### 5. User Logout

Invalidate refresh token and logout user.

```http
POST /api/v1/auth/logout
Content-Type: application/json
Authorization: Bearer <access-token>

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "message": "You have been logged out successfully."
  }
}
```

## Using Access Tokens

Include the access token in the `Authorization` header for protected endpoints:

```http
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Role-Based Access Control

### Roles

- **user**: Standard user with access to own profile and data
- **admin**: Can manage users with `user` role
- **system_admin**: Full system access, can manage all users including admins

### Permission Matrix

| Endpoint | user | admin | system_admin |
|----------|------|-------|--------------|
| GET /users/profile | ✅ (own) | ✅ (own) | ✅ |
| PUT /users/profile | ✅ (own) | ✅ (own) | ✅ |
| GET /users | ❌ | ✅ | ✅ |
| POST /users | ❌ | ✅ (user role only) | ✅ (any role) |
| PUT /users/:id | ❌ | ✅ (user role only) | ✅ |
| DELETE /users/:id | ❌ | ✅ (user role only) | ✅ |

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": [
    {
      "message": "Invalid credentials"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden",
  "errors": [
    {
      "message": "Insufficient permissions"
    }
  ]
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Conflict",
  "errors": [
    {
      "message": "Email already exists"
    }
  ]
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too Many Requests",
  "errors": [
    {
      "message": "Rate limit exceeded. Please try again later."
    }
  ]
}
```

## Security Considerations

1. **Token Storage**: Store tokens securely on the client side (e.g., secure HTTP-only cookies)
2. **HTTPS**: Always use HTTPS in production to protect tokens in transit
3. **Token Expiry**: Access tokens expire in 15 minutes - implement automatic refresh
4. **Rate Limiting**: Authentication endpoints are rate-limited to prevent brute force attacks
5. **Password Policy**: Passwords must be at least 8 characters with uppercase, lowercase, number, and special character
6. **Account Lockout**: Accounts may be temporarily locked after multiple failed login attempts

## Client Implementation Examples

### JavaScript/TypeScript
```javascript
class AuthService {
  private baseUrl = 'http://localhost:3000/api/v1';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success) {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem('refreshToken', this.refreshToken);
    }
    return data;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) return null;

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    const data = await response.json();
    if (data.success) {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem('refreshToken', this.refreshToken);
    }
    return data;
  }

  getAuthHeaders() {
    return this.accessToken ? {
      'Authorization': `Bearer ${this.accessToken}`
    } : {};
  }
}
```

### Python
```python
import requests
import json

class AuthService:
    def __init__(self, base_url="http://localhost:3000/api/v1"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None

    def login(self, email, password):
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        
        data = response.json()
        if data.get("success"):
            self.access_token = data["data"]["accessToken"]
            self.refresh_token = data["data"]["refreshToken"]
        
        return data

    def get_auth_headers(self):
        if self.access_token:
            return {"Authorization": f"Bearer {self.access_token}"}
        return {}
```
