import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  PORT!: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN!: string;

  @IsString()
  REFRESH_TOKEN_SECRET!: string;

  @IsString()
  REFRESH_TOKEN_EXPIRES_IN!: string;

  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  BCRYPT_SALT_ROUNDS!: number;

  @IsString()
  APP_NAME!: string;

  @IsString()
  APP_VERSION!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
