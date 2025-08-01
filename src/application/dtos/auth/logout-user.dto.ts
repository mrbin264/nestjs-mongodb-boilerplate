import { IsString, IsNotEmpty } from 'class-validator';

export class LogoutUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  readonly refreshToken!: string;
}
