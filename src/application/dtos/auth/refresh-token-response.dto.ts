export class RefreshTokenResponseDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: string = 'Bearer';
  readonly expiresIn: number;

  constructor(
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }
}
