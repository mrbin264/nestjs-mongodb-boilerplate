import { DomainException } from './domain.exception';

export class InvalidPasswordException extends DomainException {
  constructor(reason: string, context?: Record<string, unknown>) {
    super(
      `Invalid password: ${reason}`,
      'INVALID_PASSWORD',
      {
        reason,
        ...context,
      },
    );
  }
}
