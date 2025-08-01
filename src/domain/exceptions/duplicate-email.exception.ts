import { DomainException } from './domain.exception';

export class DuplicateEmailException extends DomainException {
  constructor(email: string, context?: Record<string, unknown>) {
    super(
      `Email already exists: ${email}`,
      'DUPLICATE_EMAIL',
      {
        email,
        ...context,
      },
    );
  }
}
