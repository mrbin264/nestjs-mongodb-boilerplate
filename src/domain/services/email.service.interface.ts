export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface IEmailService {
  /**
   * Send an email
   */
  sendEmail(options: EmailOptions): Promise<void>;

  /**
   * Send welcome email
   */
  sendWelcomeEmail(to: string, name: string, verificationToken?: string): Promise<void>;

  /**
   * Send email verification
   */
  sendEmailVerification(to: string, name: string, verificationToken: string): Promise<void>;

  /**
   * Send password reset email
   */
  sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void>;

  /**
   * Send password changed notification
   */
  sendPasswordChangedNotification(to: string, name: string): Promise<void>;

  /**
   * Send account locked notification
   */
  sendAccountLockedNotification(to: string, name: string, reason: string): Promise<void>;

  /**
   * Send security alert email
   */
  sendSecurityAlert(to: string, name: string, alertType: string, details: string): Promise<void>;

  /**
   * Render email template
   */
  renderTemplate(templateName: string, context: Record<string, unknown>): Promise<EmailTemplate>;

  /**
   * Test email configuration
   */
//   testConnection(): Promise<boolean>;
}
