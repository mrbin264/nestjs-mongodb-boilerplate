import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  readonly firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  readonly lastName?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MinLength(10, { message: 'Phone must be at least 10 characters' })
  @MaxLength(15, { message: 'Phone cannot exceed 15 characters' })
  @Transform(({ value }) => value?.trim())
  readonly phone?: string;

  @IsOptional()
  @IsString({ message: 'Avatar must be a string' })
  @MaxLength(500, { message: 'Avatar URL cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  readonly avatar?: string;

  @IsOptional()
  @IsUUID('all', { each: true, message: 'Each role ID must be a valid UUID' })
  readonly roleIds?: string[];
}
