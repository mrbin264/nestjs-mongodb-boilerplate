export interface IEmailService {
  /**
   * Send email verification email
   */
  sendEmailVerification(
    to: string,
    verificationToken: string,
    userName?: string
  ): Promise<void>;

  /**
   * Send password reset email
   */
  sendPasswordReset(
    to: string,
    resetToken: string,
    userName?: string
  ): Promise<void>;

  /**
   * Send welcome email
   */
  sendWelcomeEmail(
    to: string,
    userName?: string
  ): Promise<void>;

  /**
   * Send password changed notification
   */
  sendPasswordChangedNotification(
    to: string,
    userName?: string
  ): Promise<void>;

  /**
   * Send generic email
   */
  sendEmail(
    to: string,
    subject: string,
    content: string,
    isHtml?: boolean
  ): Promise<void>;
}
