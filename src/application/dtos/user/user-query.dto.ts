import { PaginationDto } from '../common/pagination.dto';
import { IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Search term to filter users by name or email',
    example: 'john',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }) => value?.trim())
  readonly search?: string;

  @ApiProperty({
    description: 'Filter users by specific email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  readonly email?: string;

  @ApiProperty({
    description: 'Filter users by role name',
    example: 'admin',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  @Transform(({ value }) => value?.trim())
  readonly role?: string;

  @ApiProperty({
    description: 'Filter users by email verification status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Email verified must be a boolean' })
  @Type(() => Boolean)
  readonly emailVerified?: boolean;

  @ApiProperty({
    description: 'Field to sort results by',
    example: 'createdAt',
    enum: ['email', 'createdAt', 'updatedAt', 'firstName', 'lastName'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  readonly sortBy?: 'email' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName';

  @ApiProperty({
    description: 'Sort order for results',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  readonly sortOrder?: 'asc' | 'desc';
}
