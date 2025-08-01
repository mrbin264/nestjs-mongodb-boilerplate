import { DomainException } from './domain.exception';

export class InvalidCredentialsException extends DomainException {
  constructor(context?: Record<string, unknown>) {
    super(
      'Invalid credentials provided',
      'INVALID_CREDENTIALS',
      context,
    );
  }
}
