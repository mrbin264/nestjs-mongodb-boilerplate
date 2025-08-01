import { DomainException } from './domain.exception';

export class UserNotFoundException extends DomainException {
  constructor(identifier: string, context?: Record<string, unknown>) {
    super(
      `User not found: ${identifier}`,
      'USER_NOT_FOUND',
      {
        identifier,
        ...context,
      },
    );
  }
}
