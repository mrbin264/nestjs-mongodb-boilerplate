import { Injectable } from '@nestjs/common';
import { LogoutUserDto } from '../../dtos/auth/logout-user.dto';
import { AuthMessageResponseDto } from '../../dtos/auth/auth-message-response.dto';

@Injectable()
export class LogoutUserUseCase {
  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_logoutDto: LogoutUserDto): Promise<AuthMessageResponseDto> {
    // In a stateless JWT implementation, logout is handled client-side
    // by simply discarding the token
    
    // In a more sophisticated implementation, you might:
    // 1. Add the token to a blacklist
    // 2. Store token revocation information
    // 3. Clear refresh tokens from database
    
    // For now, we'll just return a success message
    // The actual token invalidation will be handled by the client
    
    return new AuthMessageResponseDto('Logged out successfully.');
  }
}
