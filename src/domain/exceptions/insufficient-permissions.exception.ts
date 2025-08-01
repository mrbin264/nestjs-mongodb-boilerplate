import { DomainException } from './domain.exception';

export class InsufficientPermissionsException extends DomainException {
  constructor(action: string, resource: string, context?: Record<string, unknown>) {
    super(
      `Insufficient permissions to ${action} ${resource}`,
      'INSUFFICIENT_PERMISSIONS',
      {
        action,
        resource,
        ...context,
      },
    );
  }
}
