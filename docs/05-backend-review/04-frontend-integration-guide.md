# Frontend Integration Guide

**Technical Lead Integration Guide**  
**Date:** August 1, 2025  
**Version:** 1.0  
**Reviewer:** Technical Lead  

---

## Overview

This guide provides comprehensive instructions for frontend teams to integrate seamlessly with the backend API. It covers authentication flows, error handling, API patterns, and TypeScript definitions.

---

## 1. **Authentication Flow**

### 1.1 JWT Token Handling

#### Token Structure
```typescript
interface AuthTokens {
  access_token: string;    // Store in memory (expires in 15 minutes)
  refresh_token: string;   // Store in httpOnly cookie (expires in 7 days)
  token_type: 'Bearer';
  expires_in: number;      // 900 seconds (15 minutes)
}
```

#### Token Storage Strategy
```typescript
// SECURITY CRITICAL: Follow these storage patterns exactly

// 1. Access Token: Store in application state/memory (NOT localStorage)
let accessToken: string | null = null;

const setAccessToken = (token: string) => {
  accessToken = token;
  // Set automatic refresh before expiration
  scheduleTokenRefresh(token);
};

const getAccessToken = (): string | null => accessToken;

// 2. Refresh Token: Store in httpOnly, secure cookie
// Backend automatically sets this cookie, frontend cannot access it directly

// 3. Clear tokens on logout
const clearAuthTokens = () => {
  accessToken = null;
  // Clear refresh token by calling logout endpoint
};
```

#### Authentication Headers
```typescript
// REQUIRED: Include Bearer token in all authenticated requests
const createAuthHeaders = (additionalHeaders: Record<string, string> = {}): HeadersInit => {
  const token = getAccessToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...additionalHeaders,
  };
};
```

#### Token Refresh Implementation
```typescript
// CRITICAL: Implement automatic token refresh
let refreshPromise: Promise<AuthTokens> | null = null;

const refreshAccessToken = async (): Promise<AuthTokens> => {
  // Prevent multiple simultaneous refresh requests
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Include httpOnly cookie with refresh token
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (response) => {
    if (!response.ok) {
      // Refresh failed, redirect to login
      clearAuthTokens();
      window.location.href = '/login';
      throw new Error('Token refresh failed');
    }
    
    const result = await response.json();
    return result.data;
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

// Schedule automatic refresh before token expires
const scheduleTokenRefresh = (token: string) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expirationTime = payload.exp * 1000;
  const refreshTime = expirationTime - Date.now() - 60000; // Refresh 1 minute before expiry
  
  if (refreshTime > 0) {
    setTimeout(async () => {
      try {
        const newTokens = await refreshAccessToken();
        setAccessToken(newTokens.access_token);
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, refreshTime);
  }
};
```

---

## 2. **API Error Handling**

### 2.1 Standard Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message: string;
}

type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
```

### 2.2 HTTP Status Code Reference

#### Success Codes
- **200 OK**: Successful GET, PUT, DELETE operations
- **201 Created**: Successful POST operations (resource created)
- **204 No Content**: Successful operations with no response body

#### Client Error Codes
- **400 Bad Request**: Invalid input data or malformed request
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions for the operation
- **404 Not Found**: Requested resource doesn't exist
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation errors in request data
- **429 Too Many Requests**: Rate limit exceeded

#### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Service temporarily unavailable
- **503 Service Unavailable**: Server maintenance or overload

### 2.3 Error Handling Implementation
```typescript
class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
    public readonly path: string,
    public readonly timestamp: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiError = (errorResponse: ErrorResponse): void => {
  const apiError = new ApiError(
    errorResponse.statusCode,
    errorResponse.error,
    errorResponse.message,
    errorResponse.path,
    errorResponse.timestamp,
  );

  switch (errorResponse.statusCode) {
    case 401:
      // Clear tokens and redirect to login
      clearAuthTokens();
      window.location.href = '/login';
      showErrorToast('Session expired. Please log in again.');
      break;
      
    case 403:
      // Show access denied message
      showErrorToast('Access denied. You don\'t have permission for this action.');
      break;
      
    case 422:
      // Handle validation errors - usually display field-specific errors
      handleValidationErrors(errorResponse.message);
      break;
      
    case 429:
      // Handle rate limiting
      showErrorToast('Too many requests. Please wait a moment and try again.');
      break;
      
    case 409:
      // Handle conflicts (e.g., duplicate email)
      showErrorToast(errorResponse.message);
      break;
      
    default:
      // Generic error handling
      if (errorResponse.statusCode >= 500) {
        showErrorToast('Server error. Please try again later.');
      } else {
        showErrorToast(errorResponse.message || 'An unexpected error occurred');
      }
  }

  // Log error for debugging (you can send to monitoring service)
  console.error('API Error:', apiError);
};

const handleValidationErrors = (message: string): void => {
  // Parse validation error message and show field-specific errors
  // Implementation depends on your form library (React Hook Form, Formik, etc.)
  try {
    const errors = JSON.parse(message);
    Object.entries(errors).forEach(([field, errorMsg]) => {
      showFieldError(field, errorMsg as string);
    });
  } catch {
    // Fallback to generic error message
    showErrorToast(message);
  }
};
```

---

## 3. **API Service Structure**

### 3.1 Base API Client
```typescript
class ApiClient {
  private baseUrl: string;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: createAuthHeaders(options.headers as Record<string, string>),
      credentials: 'include', // For refresh token cookie
    };

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401 && this.retryCount < this.maxRetries) {
        this.retryCount++;
        
        try {
          const newTokens = await refreshAccessToken();
          setAccessToken(newTokens.access_token);
          
          // Retry original request with new token
          const retryConfig = {
            ...config,
            headers: createAuthHeaders(options.headers as Record<string, string>),
          };
          
          return this.request(endpoint, { ...options, headers: retryConfig.headers });
        } catch (refreshError) {
          // Refresh failed, let error handling take over
          this.retryCount = 0;
          throw refreshError;
        }
      }

      this.retryCount = 0; // Reset retry count on successful request

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        handleApiError(errorData);
        throw new ApiError(
          errorData.statusCode,
          errorData.error,
          errorData.message,
          errorData.path,
          errorData.timestamp,
        );
      }

      const result: SuccessResponse<T> = await response.json();
      return result.data;

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      console.error('Network error:', error);
      showErrorToast('Network error. Please check your connection.');
      throw new Error('Network error occurred');
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
```

### 3.2 Service Layer Examples

#### Authentication Service
```typescript
class AuthService {
  async login(credentials: { email: string; password: string }): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: UserProfile;
  }> {
    const result = await apiClient.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: UserProfile;
    }>('/auth/login', credentials);

    // Store tokens after successful login
    setAccessToken(result.access_token);
    
    return result;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ message: string }> {
    return apiClient.post('/auth/register', userData);
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear tokens regardless of API call result
      clearAuthTokens();
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  }
}

export const authService = new AuthService();
```

#### User Service
```typescript
class UserService {
  async getUsers(params: {
    limit?: number;
    offset?: number;
    search?: string;
    role?: 'user' | 'admin' | 'system_admin';
    status?: 'active' | 'inactive';
  } = {}): Promise<{
    users: UserProfile[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    ).toString();
    
    return apiClient.get(`/users?${queryString}`);
  }

  async getUserById(id: string): Promise<UserProfile> {
    return apiClient.get(`/users/${id}`);
  }

  async createUser(userData: {
    email: string;
    password: string;
    roles: ('user' | 'admin' | 'system_admin')[];
    firstName?: string;
    lastName?: string;
  }): Promise<UserProfile> {
    return apiClient.post('/users', userData);
  }

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.put(`/users/${id}`, updates);
  }

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  }
}

export const userService = new UserService();
```

#### Profile Service
```typescript
class ProfileService {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get('/profile');
  }

  async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
  }): Promise<UserProfile> {
    return apiClient.put('/profile', updates);
  }

  async deleteProfile(): Promise<void> {
    return apiClient.delete('/profile');
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return apiClient.put('/profile/password', data);
  }
}

export const profileService = new ProfileService();
```

---

## 4. **Request/Response Patterns**

### 4.1 Pagination
```typescript
// Standard pagination parameters for all list endpoints
interface PaginationParams {
  limit?: number;    // Default: 10, Max: 100
  offset?: number;   // Default: 0
}

interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  message: string;
}

// Usage example
const fetchUsers = async (page = 0, pageSize = 10) => {
  const response = await userService.getUsers({
    limit: pageSize,
    offset: page * pageSize,
  });
  
  return {
    users: response.users,
    hasNextPage: response.pagination.hasMore,
    totalCount: response.pagination.total,
  };
};
```

### 4.2 Search and Filtering
```typescript
// Query parameters for list endpoints
interface UserQueryParams extends PaginationParams {
  search?: string;     // Search in name and email
  role?: 'user' | 'admin' | 'system_admin';
  status?: 'active' | 'inactive';
}

// Implementation with React Hook
const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<UserQueryParams>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers(filters);
      setUsers(response.users);
    } catch (error) {
      // Error handling is done by apiClient
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, setFilters, refetch: fetchUsers };
};
```

### 4.3 Form Handling with Validation
```typescript
// React Hook Form integration example
const useUserForm = (initialData?: Partial<UserProfile>) => {
  const form = useForm<CreateUserDto>({
    defaultValues: initialData,
    resolver: yupResolver(userValidationSchema),
  });

  const onSubmit = async (data: CreateUserDto) => {
    try {
      const result = await userService.createUser(data);
      showSuccessToast('User created successfully');
      return result;
    } catch (error) {
      // API client handles error display
      if (error instanceof ApiError && error.statusCode === 422) {
        // Set field-specific errors from validation response
        const fieldErrors = parseValidationErrors(error.message);
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof CreateUserDto, { message });
        });
      }
      throw error;
    }
  };

  return { form, onSubmit };
};
```

---

## 5. **Type Definitions**

### 5.1 User-Related Types
```typescript
interface UserProfile {
  id: string;
  email: string;
  roles: ('user' | 'admin' | 'system_admin')[];
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  };
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;      // ISO date string
  updatedAt: string;      // ISO date string
  lastLoginAt?: string;   // ISO date string
}

interface CreateUserDto {
  email: string;
  password: string;
  roles: ('user' | 'admin' | 'system_admin')[];
  firstName?: string;
  lastName?: string;
}

interface UpdateUserDto {
  email?: string;
  roles?: ('user' | 'admin' | 'system_admin')[];
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

interface UserQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  role?: 'user' | 'admin' | 'system_admin';
  status?: 'active' | 'inactive';
}
```

### 5.2 Authentication Types
```typescript
interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserProfile;
}

interface ForgotPasswordDto {
  email: string;
}

interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
```

### 5.3 API Response Types
```typescript
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  message: string;
}

type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
```

---

## 6. **React Integration Examples**

### 6.1 Authentication Context
```typescript
interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (credentials: LoginDto) => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const register = async (userData: RegisterDto) => {
    await authService.register(userData);
    // User needs to verify email before logging in
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const profile = await profileService.getProfile();
          setUser(profile);
        }
      } catch (error) {
        // Token invalid or expired
        clearAuthTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 6.2 Protected Route Component
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('user' | 'admin' | 'system_admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = ['user'] 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user?.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};
```

### 6.3 API Hook Pattern
```typescript
// Generic API hook
function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// Usage example
const UserList: React.FC = () => {
  const { data: users, loading, error, refetch } = useApi(
    () => userService.getUsers({ limit: 20 }),
    []
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {users?.users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

---

## 7. **Best Practices**

### 7.1 Security Best Practices
- ✅ Store access tokens in memory only (never localStorage)
- ✅ Use httpOnly cookies for refresh tokens
- ✅ Implement automatic token refresh
- ✅ Clear tokens immediately on logout
- ✅ Validate user permissions on the frontend (UI-only, backend enforces)
- ✅ Use HTTPS in production
- ✅ Implement proper CORS handling

### 7.2 Performance Best Practices
- ✅ Implement request deduplication for identical API calls
- ✅ Use proper loading states and skeleton screens
- ✅ Implement pagination for large datasets
- ✅ Cache user profile data appropriately
- ✅ Debounce search inputs
- ✅ Use React.memo for expensive components

### 7.3 Error Handling Best Practices
- ✅ Provide user-friendly error messages
- ✅ Implement proper retry logic for failed requests
- ✅ Log errors for debugging purposes
- ✅ Handle network errors gracefully
- ✅ Show field-specific validation errors
- ✅ Implement global error boundaries

### 7.4 Code Organization Best Practices
- ✅ Separate API logic from UI components
- ✅ Use TypeScript for type safety
- ✅ Implement proper loading and error states
- ✅ Create reusable hooks and utilities
- ✅ Follow consistent naming conventions
- ✅ Document complex integration logic

---

## 8. **Testing Integration**

### 8.1 Mocking API Calls
```typescript
// Mock API service for testing
export const mockApiClient = {
  request: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Example test
test('should login user successfully', async () => {
  const mockResponse = {
    access_token: 'mock-token',
    user: { id: '1', email: 'test@example.com' },
  };
  
  mockApiClient.post.mockResolvedValue(mockResponse);
  
  const result = await authService.login({
    email: 'test@example.com',
    password: 'password',
  });
  
  expect(result).toEqual(mockResponse);
  expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
    email: 'test@example.com',
    password: 'password',
  });
});
```

---

## Summary

This integration guide provides everything needed for seamless frontend-backend integration. Follow these patterns for consistent, secure, and maintainable API integration.

**Key Points:**
- Security-first authentication with proper token management
- Comprehensive error handling with user-friendly messages
- Type-safe API interactions with TypeScript
- Performance-optimized patterns with proper loading states
- React-specific examples and best practices

---

**Integration Guide By:** Technical Lead  
**Date:** August 1, 2025  
**Last Updated:** August 1, 2025
