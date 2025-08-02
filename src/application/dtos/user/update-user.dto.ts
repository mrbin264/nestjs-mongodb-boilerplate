import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Updated first name',
    example: 'Robert',
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
    description: 'Updated last name',
    example: 'Williams',
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
    description: 'Updated phone number',
    example: '+1-555-789-0123',
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
    description: 'Updated avatar URL',
    example: 'https://example.com/avatars/robert-williams.jpg',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Avatar must be a string' })
  @MaxLength(500, { message: 'Avatar URL cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  readonly avatar?: string;

  @ApiProperty({
    description: 'Updated array of role IDs',
    example: ['550e8400-e29b-41d4-a716-446655440001'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsUUID('all', { each: true, message: 'Each role ID must be a valid UUID' })
  readonly roleIds?: string[];
}
