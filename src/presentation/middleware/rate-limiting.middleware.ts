import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { User } from '../../domain/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user?: User;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
  };

  // Specific configurations for different routes
  private readonly routeConfigs: Record<string, RateLimitConfig> = {
    '/auth/login': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per 15 minutes
      message: 'Too many login attempts, please try again later.',
    },
    '/auth/register': {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registration attempts per hour
      message: 'Too many registration attempts, please try again later.',
    },
    '/auth/forgot-password': {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 password reset attempts per hour
      message: 'Too many password reset attempts, please try again later.',
    },
    '/auth/reset-password': {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 password reset attempts per hour
      message: 'Too many password reset attempts, please try again later.',
    },
  };

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const key = this.generateKey(req);
    const config = this.getConfigForRoute(req.path);
    
    this.cleanupExpiredEntries();
    
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: Date.now() + config.windowMs,
      };
    }

    const entry = this.store[key];
    
    // Reset if the window has expired
    if (Date.now() > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = Date.now() + config.windowMs;
    }

    // Check if limit is exceeded
    if (entry.count >= config.max) {
      const remainingTime = Math.ceil((entry.resetTime - Date.now()) / 1000);
      
      res.set({
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        'Retry-After': remainingTime.toString(),
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: config.message,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment the counter
    entry.count++;

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': (config.max - entry.count).toString(),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
    });

    next();
  }

  private generateKey(req: AuthenticatedRequest): string {
    // Use IP address and route for rate limiting key
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const route = req.path;
    
    // Include user ID if authenticated for user-based rate limiting
    const userId = req.user?.id?.value;
    
    return userId ? `${ip}:${route}:${userId}` : `${ip}:${route}`;
  }

  private getConfigForRoute(path: string): RateLimitConfig {
    // Check for exact match first
    if (this.routeConfigs[path]) {
      return this.routeConfigs[path];
    }

    // Check for pattern matches
    for (const route in this.routeConfigs) {
      if (path.startsWith(route)) {
        return this.routeConfigs[route];
      }
    }

    return this.defaultConfig;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }
}
