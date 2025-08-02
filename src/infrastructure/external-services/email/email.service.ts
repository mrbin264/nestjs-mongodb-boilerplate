import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { 
  IEmailService, 
  EmailOptions, 
  EmailTemplate 
} from '../../../domain/services/email.service.interface';

@Injectable()
export class EmailService implements IEmailService {
  private transporter!: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter(): void {
    // Support both SMTP_* and EMAIL_SERVICE_* environment variables
    const host = this.configService.get<string>('SMTP_HOST') || 
                 this.configService.get<string>('EMAIL_SERVICE_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 
                 this.configService.get<number>('EMAIL_SERVICE_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER') || 
                 this.configService.get<string>('EMAIL_SERVICE_USER');
    const pass = this.configService.get<string>('SMTP_PASS') || 
                 this.configService.get<string>('EMAIL_SERVICE_PASS');

    // In development, create a mock transporter if SMTP is not configured
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    
    if (!host || !user || !pass) {
      if (nodeEnv === 'development') {
        this.logger.warn('SMTP configuration is incomplete. Using mock email service for development.');
        this.createMockTransporter();
        return;
      } else {
        throw new Error('SMTP configuration is incomplete. Please set EMAIL_SERVICE_HOST, EMAIL_SERVICE_USER, and EMAIL_SERVICE_PASS environment variables.');
      }
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  private createMockTransporter(): void {
    // Create a mock transporter for development
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM_EMAIL') || 
                 this.configService.get<string>('EMAIL_SERVICE_FROM', 'noreply@example.com');
    
    const mailOptions = {
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log for development when using mock transporter
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      if (nodeEnv === 'development' && info.envelope) {
        this.logger.log(`📧 Mock email sent to: ${mailOptions.to}`);
        this.logger.log(`📧 Subject: ${mailOptions.subject}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string, verificationToken?: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const verificationUrl = verificationToken 
      ? `${appUrl}/verify-email?token=${verificationToken}`
      : null;

    const html = `
      <h1>Welcome to our platform, ${name}!</h1>
      <p>Thank you for joining us. We're excited to have you on board.</p>
      ${verificationUrl ? `
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link into your browser: ${verificationUrl}</p>
      ` : ''}
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>The Team</p>
    `;

    const text = `
      Welcome to our platform, ${name}!
      
      Thank you for joining us. We're excited to have you on board.
      
      ${verificationUrl ? `Please verify your email address by visiting: ${verificationUrl}` : ''}
      
      If you have any questions, feel free to contact our support team.
      
      Best regards,
      The Team
    `;

    await this.sendEmail({
      to,
      subject: 'Welcome to our platform!',
      html,
      text,
    });
  }

  async sendEmailVerification(to: string, name: string, verificationToken: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <h1>Verify Your Email Address</h1>
      <p>Hello ${name},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy and paste this link into your browser: ${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    `;

    const text = `
      Verify Your Email Address
      
      Hello ${name},
      
      Please verify your email address by visiting: ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't request this verification, please ignore this email.
      
      Best regards,
      The Team
    `;

    await this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Reset Your Password</h1>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>Or copy and paste this link into your browser: ${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>The Team</p>
    `;

    const text = `
      Reset Your Password
      
      Hello ${name},
      
      You requested a password reset. Visit this link to reset your password: ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email and your password will remain unchanged.
      
      Best regards,
      The Team
    `;

    await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      html,
      text,
    });
  }

  async sendPasswordChangedNotification(to: string, name: string): Promise<void> {
    const html = `
      <h1>Password Changed Successfully</h1>
      <p>Hello ${name},</p>
      <p>Your password has been successfully changed.</p>
      <p>If you didn't make this change, please contact our support team immediately.</p>
      <p>For your security, we recommend:</p>
      <ul>
        <li>Using a strong, unique password</li>
        <li>Enabling two-factor authentication if available</li>
        <li>Regularly monitoring your account activity</li>
      </ul>
      <p>Best regards,<br>The Team</p>
    `;

    const text = `
      Password Changed Successfully
      
      Hello ${name},
      
      Your password has been successfully changed.
      
      If you didn't make this change, please contact our support team immediately.
      
      For your security, we recommend:
      - Using a strong, unique password
      - Enabling two-factor authentication if available
      - Regularly monitoring your account activity
      
      Best regards,
      The Team
    `;

    await this.sendEmail({
      to,
      subject: 'Password Changed Successfully',
      html,
      text,
    });
  }

  async sendAccountLockedNotification(to: string, name: string, reason: string): Promise<void> {
    const html = `
      <h1>Account Locked</h1>
      <p>Hello ${name},</p>
      <p>Your account has been temporarily locked.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you believe this is an error or need assistance, please contact our support team.</p>
      <p>Best regards,<br>The Team</p>
    `;

    const text = `
      Account Locked
      
      Hello ${name},
      
      Your account has been temporarily locked.
      
      Reason: ${reason}
      
      If you believe this is an error or need assistance, please contact our support team.
      
      Best regards,
      The Team
    `;

    await this.sendEmail({
      to,
      subject: 'Account Locked',
      html,
      text,
    });
  }

  async sendSecurityAlert(to: string, name: string, alertType: string, details: string): Promise<void> {
    const html = `
      <h1>Security Alert</h1>
      <p>Hello ${name},</p>
      <p>We detected unusual activity on your account.</p>
      <p><strong>Alert Type:</strong> ${alertType}</p>
      <p><strong>Details:</strong> ${details}</p>
      <p>If this was you, no action is required. If you don't recognize this activity, please:</p>
      <ul>
        <li>Change your password immediately</li>
        <li>Review your account settings</li>
        <li>Contact our support team</li>
      </ul>
      <p>Best regards,<br>The Team</p>
    `;

    const text = `
      Security Alert
      
      Hello ${name},
      
      We detected unusual activity on your account.
      
      Alert Type: ${alertType}
      Details: ${details}
      
      If this was you, no action is required. If you don't recognize this activity, please:
      - Change your password immediately
      - Review your account settings
      - Contact our support team
      
      Best regards,
      The Team
    `;

    await this.sendEmail({
      to,
      subject: 'Security Alert',
      html,
      text,
    });
  }

  async renderTemplate(templateName: string, context: Record<string, unknown>): Promise<EmailTemplate> {
    // This is a basic implementation - in a real app you might use a template engine like Handlebars
    // For now, we'll return a basic template
    return {
      subject: `Template: ${templateName}`,
      html: `<h1>Template: ${templateName}</h1><pre>${JSON.stringify(context, null, 2)}</pre>`,
      text: `Template: ${templateName}\n\n${JSON.stringify(context, null, 2)}`,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
