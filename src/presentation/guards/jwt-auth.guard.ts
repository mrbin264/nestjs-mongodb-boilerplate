import { Injectable, ExecutionContext, UnauthorizedException, Inject, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_KEY } from '../decorators/public.decorator';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../infrastructure/infrastructure.module';
import { IJwtService, JwtPayload } from '../../domain/services/jwt.service.interface';
import { JWT_SERVICE } from '../../infrastructure/infrastructure.module';
import { UserId } from '../../domain/value-objects/user-id.vo';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(JWT_SERVICE) private jwtService: IJwtService,
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token is required');
    }

    const token = authHeader.substring(7);

    try {
      const payload: JwtPayload = this.jwtService.verifyAccessToken(token);
      
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Fetch the user from database to ensure they still exist and are active
      const userId = UserId.fromString(payload.sub);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Attach user to request
      request.user = user;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
