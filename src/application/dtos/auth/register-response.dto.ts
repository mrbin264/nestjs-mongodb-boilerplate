export class RegisterResponseDto {
  readonly id: string;
  readonly email: string;
  readonly message: string;
  readonly emailVerificationRequired: boolean;

  constructor(
    id: string,
    email: string,
    message: string = 'User registered successfully',
    emailVerificationRequired: boolean = true
  ) {
    this.id = id;
    this.email = email;
    this.message = message;
    this.emailVerificationRequired = emailVerificationRequired;
  }
}
