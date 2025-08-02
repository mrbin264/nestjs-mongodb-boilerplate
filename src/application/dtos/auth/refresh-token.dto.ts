import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to generate new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MGYxYjJlNGQxYTJjM2I0ZTVmNmE3YjgiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZXMiOlsidXNlciJdLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTYyMzc2NjQwMCwiZXhwIjoxNjI0MzcxMjAwfQ.abc123xyz',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  readonly refreshToken!: string;
}
