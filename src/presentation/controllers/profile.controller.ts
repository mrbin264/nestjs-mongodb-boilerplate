import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

// DTOs
import { UpdateProfileDto } from '../../application/dtos/profile/update-profile.dto';
import { ChangePasswordDto } from '../../application/dtos/profile/change-password.dto';
import { ProfileResponseDto } from '../../application/dtos/profile/profile-response.dto';
import { ResponseDto } from '../../application/dtos/common/response.dto';

// Use Cases
import {
  UpdateProfileUseCase,
  ChangePasswordUseCase,
  GetProfileUseCase,
} from '../../application/use-cases';

// Guards and Decorators
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../../domain/entities/user.entity';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile', description: 'Retrieve the profile information of the currently authenticated user.' })
  @ApiOkResponse({ description: 'Profile retrieved successfully', type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getProfile(
    @CurrentUser() user: User,
  ): Promise<ResponseDto<ProfileResponseDto>> {
    const result = await this.getProfileUseCase.execute(user.id.value);
    return ResponseDto.success(result, 'Profile retrieved successfully');
  }

  @Put()
  @ApiOperation({ summary: 'Update user profile', description: 'Update the profile information of the currently authenticated user.' })
  @ApiOkResponse({ description: 'Profile updated successfully', type: ProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: User,
  ): Promise<ResponseDto<ProfileResponseDto>> {
    const result = await this.updateProfileUseCase.execute(
      user.id.value,
      updateProfileDto,
    );
    return ResponseDto.success(result, 'Profile updated successfully');
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password', description: 'Change the password of the currently authenticated user.' })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data or current password incorrect' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: User,
  ): Promise<ResponseDto<{ message: string }>> {
    await this.changePasswordUseCase.execute(
      user.id.value,
      changePasswordDto,
    );
    
    return ResponseDto.success(
      { message: 'Password changed successfully' },
      'Password changed successfully'
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account', description: 'Delete the current user account. Currently not implemented.' })
  @ApiOkResponse({ description: 'Account deletion endpoint (not implemented)' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async deleteProfile(): Promise<ResponseDto<{ message: string }>> {
    // For now, just return a message since account deletion 
    // would require a dedicated use case and proper cleanup
    return ResponseDto.success(
      { message: 'Account deletion not implemented yet' },
      'Account deletion endpoint'
    );
  }
}
