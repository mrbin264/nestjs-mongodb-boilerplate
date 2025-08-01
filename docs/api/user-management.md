# User Management API Guide

This guide covers the user management endpoints for administrators and system administrators.

## Overview

The User Management API provides endpoints for:

- Creating new users
- Retrieving user information
- Updating user profiles
- Managing user roles
- Searching and filtering users
- User account management

## Authentication Required

All user management endpoints require authentication with appropriate permissions:

- **Admin**: Can manage users with `user` role only
- **System Admin**: Can manage all users including admins

## User Endpoints

### 1. Get Users List

Retrieve a paginated list of users with optional filtering.

```http
GET /api/v1/users?page=1&limit=10&search=john&role=user
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search in email, firstName, lastName
- `role` (optional): Filter by role (`user`, `admin`, `system_admin`)
- `emailVerified` (optional): Filter by email verification status (`true`, `false`)
- `isActive` (optional): Filter by account status (`true`, `false`)

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "john.doe@example.com",
        "roles": ["user"],
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://example.com/avatar.jpg",
          "phone": "+1234567890"
        },
        "emailVerified": true,
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 2. Get User by ID

Retrieve detailed information about a specific user.

```http
GET /api/v1/users/507f1f77bcf86cd799439011
Authorization: Bearer <access-token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "roles": ["user"],
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg",
      "phone": "+1234567890"
    },
    "emailVerified": true,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "createdBy": "507f1f77bcf86cd799439012"
  }
}
```

### 3. Create User

Create a new user account (Admin/System Admin only).

```http
POST /api/v1/users
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "roles": ["user"],
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567890"
  },
  "sendWelcomeEmail": true
}
```

**Request Body:**
- `email` (required): User email address
- `password` (required): User password (will be hashed)
- `roles` (required): Array of roles (`["user"]` for admin, any roles for system_admin)
- `profile` (optional): User profile information
- `sendWelcomeEmail` (optional): Send welcome email (default: true)

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "email": "newuser@example.com",
    "roles": ["user"],
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+1234567890"
    },
    "emailVerified": false,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "createdBy": "507f1f77bcf86cd799439011"
  }
}
```

### 4. Update User

Update user information (Admin/System Admin only).

```http
PUT /api/v1/users/507f1f77bcf86cd799439013
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "roles": ["admin"],
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith-Johnson",
    "phone": "+1234567890",
    "avatar": "https://example.com/new-avatar.jpg"
  },
  "isActive": false
}
```

**Request Body (all optional):**
- `roles`: Array of roles
- `profile`: Updated profile information
- `isActive`: Account status
- `emailVerified`: Email verification status

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "email": "newuser@example.com",
    "roles": ["admin"],
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith-Johnson",
      "phone": "+1234567890",
      "avatar": "https://example.com/new-avatar.jpg"
    },
    "emailVerified": false,
    "isActive": false,
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

### 5. Delete User

Soft delete a user account (Admin/System Admin only).

```http
DELETE /api/v1/users/507f1f77bcf86cd799439013
Authorization: Bearer <access-token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "message": "User account has been deactivated and will be permanently deleted after 30 days."
  }
}
```

## Profile Endpoints (Self-Management)

### 1. Get Own Profile

Retrieve current user's profile information.

```http
GET /api/v1/profile
Authorization: Bearer <access-token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "roles": ["user"],
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg",
      "phone": "+1234567890"
    },
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 2. Update Own Profile

Update current user's profile information.

```http
PUT /api/v1/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "profile": {
    "firstName": "John",
    "lastName": "Doe Jr.",
    "phone": "+1234567891",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe Jr.",
      "phone": "+1234567891",
      "avatar": "https://example.com/new-avatar.jpg"
    },
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

### 3. Change Password

Change current user's password.

```http
POST /api/v1/profile/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Your password has been changed successfully. All other sessions have been invalidated."
  }
}
```

### 4. Delete Own Profile

Delete current user's account.

```http
DELETE /api/v1/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "password": "CurrentPassword123!",
  "confirmDeletion": "DELETE"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile deleted successfully",
  "data": {
    "message": "Your account has been scheduled for deletion and will be permanently removed after 30 days."
  }
}
```

## Permission Matrix

| Action | User | Admin | System Admin |
|--------|------|--------|--------------|
| GET /users | ❌ | ✅ | ✅ |
| GET /users/:id | ❌ | ✅ (own users) | ✅ |
| POST /users | ❌ | ✅ (user role only) | ✅ (any role) |
| PUT /users/:id | ❌ | ✅ (own users) | ✅ |
| DELETE /users/:id | ❌ | ✅ (own users) | ✅ |
| GET /profile | ✅ | ✅ | ✅ |
| PUT /profile | ✅ | ✅ | ✅ |
| POST /profile/change-password | ✅ | ✅ | ✅ |
| DELETE /profile | ✅ | ✅ | ✅ |

## Error Responses

### 403 Forbidden (Insufficient Permissions)
```json
{
  "success": false,
  "message": "Forbidden",
  "errors": [
    {
      "message": "You don't have permission to manage this user"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Not Found",
  "errors": [
    {
      "message": "User not found"
    }
  ]
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "roles",
      "message": "Admin users can only assign 'user' role"
    },
    {
      "field": "profile.phone",
      "message": "Phone number must be in valid format"
    }
  ]
}
```

## Business Rules

### Admin Restrictions
- Admins can only create/manage users with `user` role
- Admins cannot promote users to `admin` or `system_admin` roles
- Admins cannot manage other admins or system admins

### System Admin Capabilities
- Can manage all users regardless of role
- Can assign any role to users
- Can override most business rules

### Account Deletion
- User accounts are soft-deleted (marked as inactive)
- Hard deletion occurs after 30 days
- Deleted accounts can be restored within the 30-day period

### Email Verification
- New users must verify their email before full access
- Unverified users have limited functionality
- Email verification tokens expire after 24 hours

## Client Implementation Examples

### JavaScript/TypeScript
```javascript
class UserService {
  constructor(private authService: AuthService) {}

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/v1/users?${queryString}`, {
      headers: this.authService.getAuthHeaders()
    });
    return response.json();
  }

  async createUser(userData) {
    const response = await fetch('/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders()
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  async updateUser(userId, updates) {
    const response = await fetch(`/api/v1/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    return response.json();
  }
}
```
