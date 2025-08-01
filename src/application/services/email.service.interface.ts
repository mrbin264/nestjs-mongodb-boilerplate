import { User } from '../../domain/entities/user.entity';

export interface EmailTemplateData {
  [key: string]: string | number | boolean | Date;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: EmailTemplateData;
}

export interface IEmailService {
  /**
   * Send email verification message
   */
  sendVerificationEmail(user: User, verificationToken: string): Promise<void>;

  /**
   * Send password reset email
   */
  sendPasswordResetEmail(user: User, resetToken: string): Promise<void>;

  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail(user: User, temporaryPassword?: string): Promise<void>;

  /**
   * Send password change confirmation email
   */
  sendPasswordChangeConfirmation(user: User): Promise<void>;

  /**
   * Send account deletion confirmation email
   */
  sendAccountDeletionConfirmation(user: User): Promise<void>;

  /**
   * Send generic email with template
   */
  sendTemplatedEmail(options: EmailOptions): Promise<void>;

  /**
   * Send plain email
   */
  sendEmail(to: string, subject: string, content: string, isHtml?: boolean): Promise<void>;

  /**
   * Validate email address format
   */
  validateEmailAddress(email: string): boolean;
}
