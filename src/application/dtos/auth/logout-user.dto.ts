import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutUserDto {
  @ApiProperty({
    description: 'Refresh token to invalidate during logout',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MGYxYjJlNGQxYTJjM2I0ZTVmNmE3YjgiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZXMiOlsidXNlciJdLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTYyMzc2NjQwMCwiZXhwIjoxNjI0MzcxMjAwfQ.refresh123token',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  readonly refreshToken!: string;
}
