import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBadRequestResponse, 
  ApiConflictResponse, 
  ApiUnauthorizedResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';

// DTOs
import { RegisterUserDto } from '../../application/dtos/auth/register-user.dto';
import { LoginUserDto } from '../../application/dtos/auth/login-user.dto';
import { RefreshTokenDto } from '../../application/dtos/auth/refresh-token.dto';
import { ForgotPasswordDto } from '../../application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '../../application/dtos/auth/reset-password.dto';
import { LogoutUserDto } from '../../application/dtos/auth/logout-user.dto';

// Response DTOs
import { RegisterResponseDto } from '../../application/dtos/auth/register-response.dto';
import { LoginResponseDto } from '../../application/dtos/auth/login-response.dto';
import { RefreshTokenResponseDto } from '../../application/dtos/auth/refresh-token-response.dto';
import { AuthMessageResponseDto } from '../../application/dtos/auth/auth-message-response.dto';
import { ResponseDto } from '../../application/dtos/common/response.dto';

// Use Cases
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  LogoutUserUseCase,
} from '../../application/use-cases';

// Guards and Decorators
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../../domain/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
  ) {}

  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already exists' })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterUserDto): Promise<ResponseDto<RegisterResponseDto>> {
    const result = await this.registerUserUseCase.execute(registerDto);
    return ResponseDto.success(result, 'User registered successfully');
  }

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto): Promise<ResponseDto<LoginResponseDto>> {
    const result = await this.loginUserUseCase.execute(loginDto);
    return ResponseDto.success(result, 'Login successful');
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshTokenDto): Promise<ResponseDto<RefreshTokenResponseDto>> {
    const result = await this.refreshTokenUseCase.execute(refreshDto);
    return ResponseDto.success(result, 'Token refreshed successfully');
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset instructions sent',
    type: AuthMessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid email address' })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ResponseDto<AuthMessageResponseDto>> {
    const result = await this.forgotPasswordUseCase.execute(forgotPasswordDto);
    return ResponseDto.success(result, 'Password reset instructions sent');
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully',
    type: AuthMessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid token or password' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResponseDto<AuthMessageResponseDto>> {
    const result = await this.resetPasswordUseCase.execute(resetPasswordDto);
    return ResponseDto.success(result, 'Password reset successfully');
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    type: AuthMessageResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: User,
    @Body() logoutDto: LogoutUserDto,
  ): Promise<ResponseDto<AuthMessageResponseDto>> {
    // Create the logout request with user ID
    const logoutRequest = {
      refreshToken: logoutDto.refreshToken,
      userId: user.id.value,
    };
    
    const result = await this.logoutUserUseCase.execute(logoutRequest);
    return ResponseDto.success(result, 'Logout successful');
  }
}
