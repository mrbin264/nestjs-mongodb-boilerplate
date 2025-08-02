import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'alice.johnson@company.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  readonly email!: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'AdminPassword123!',
    minLength: 8,
    maxLength: 100,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  readonly password!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Alice',
    required: false,
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  readonly firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Johnson',
    required: false,
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  readonly lastName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1-555-246-8135',
    required: false,
    minLength: 10,
    maxLength: 15,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MinLength(10, { message: 'Phone must be at least 10 characters' })
  @MaxLength(15, { message: 'Phone cannot exceed 15 characters' })
  @Transform(({ value }) => value?.trim())
  readonly phone?: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatars/alice-johnson.jpg',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Avatar must be a string' })
  @MaxLength(500, { message: 'Avatar URL cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  readonly avatar?: string;

  @ApiProperty({
    description: 'Array of role IDs to assign to the user',
    example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsUUID('all', { each: true, message: 'Each role ID must be a valid UUID' })
  readonly roleIds?: string[];
}
