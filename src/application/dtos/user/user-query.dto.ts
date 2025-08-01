import { PaginationDto } from '../common/pagination.dto';
import { IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }) => value?.trim())
  readonly search?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  readonly email?: string;

  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  @Transform(({ value }) => value?.trim())
  readonly role?: string;

  @IsOptional()
  @IsBoolean({ message: 'Email verified must be a boolean' })
  @Type(() => Boolean)
  readonly emailVerified?: boolean;

  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  readonly sortBy?: 'email' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName';

  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  readonly sortOrder?: 'asc' | 'desc';
}
