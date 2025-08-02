import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailService } from '../../../domain/services/email.service.interface';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: never[];
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    // Support both SMTP_* and EMAIL_SERVICE_* environment variables
    const host =
      this.configService.get<string>('SMTP_HOST') ||
      this.configService.get<string>('EMAIL_SERVICE_HOST');
    const port =
      this.configService.get<number>('SMTP_PORT') ||
      this.configService.get<number>('EMAIL_SERVICE_PORT', 587);
    const user =
      this.configService.get<string>('SMTP_USER') ||
      this.configService.get<string>('EMAIL_SERVICE_USER');
    const pass =
      this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('EMAIL_SERVICE_PASS');

    // In development, create a mock transporter if SMTP is not configured
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (!host || !user || !pass) {
      if (nodeEnv === 'development') {
        this.logger.warn(
          'SMTP configuration is incomplete. Using mock email service for development.',
        );
        return this.createMockTransporter();
      } else {
        throw new Error(
          'SMTP configuration is incomplete. Please set EMAIL_SERVICE_HOST, EMAIL_SERVICE_USER, and EMAIL_SERVICE_PASS environment variables.',
        );
      }
    }

    this.logger.log('Configuring SMTP email service');
    return nodemailer.createTransport({
      host,
      port: port || 587,
      secure: false,
      auth: {
        user,
        pass,
      },
    });
  }

  private createMockTransporter(): nodemailer.Transporter {
    // Create a mock transporter for development
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM_EMAIL') ||
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
      if (nodeEnv === 'development') {
        this.logger.log(`📧 Mock email sent to: ${mailOptions.to}`);
        this.logger.log(`📧 Subject: ${mailOptions.subject}`);
        if (info.message) {
          this.logger.debug(`📧 Email content: ${info.message.toString().substring(0, 200)}...`);
        }
      } else {
        this.logger.log(`📧 Email sent successfully to: ${mailOptions.to}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const subject = 'Welcome to Our Platform!';
    const html = `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for joining our platform.</p>
      <p>We're excited to have you on board!</p>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendEmailVerification(to: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token=${verificationToken}`;
    const subject = 'Email Verification';
    const html = `
      <h1>Email Verification</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendPasswordChangedNotification(to: string, name: string): Promise<void> {
    const subject = 'Password Changed Successfully';
    const html = `
    <h1>Password Changed</h1>
    <p>Hello ${name},</p>
    <p>Your password has been successfully changed.</p>
    <p>If you did not make this change, please contact support immediately.</p>
    <p>Time: ${new Date().toLocaleString()}</p>
  `;

    await this.sendEmail({ to, subject, html });
  }

  async sendAccountLockedNotification(to: string, name: string): Promise<void> {
    const subject = 'Account Locked - Security Alert';
    const html = `
    <h1>Account Locked</h1>
    <p>Hello ${name},</p>
    <p>Your account has been locked due to multiple failed login attempts.</p>
    <p>If this was you, please wait 15 minutes before trying again or contact support.</p>
    <p>If this was not you, your account may be under attack. Please contact support immediately.</p>
    <p>Time: ${new Date().toLocaleString()}</p>
  `;

    await this.sendEmail({ to, subject, html });
  }

  async sendSecurityAlert(to: string, alertType: string, details: string): Promise<void> {
    const subject = `Security Alert: ${alertType}`;
    const html = `
    <h1>Security Alert</h1>
    <p>We detected unusual activity on your account.</p>
    <p><strong>Alert Type:</strong> ${alertType}</p>
    <p><strong>Details:</strong> ${details}</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    <p>If this was not you, please change your password immediately and contact support.</p>
  `;

    await this.sendEmail({ to, subject, html });
  }

  async renderTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<EmailTemplate> {
    // Template definitions with subject and content
    const templates: Record<string, { subject: string; html: string; text?: string }> = {
      welcome: {
        subject: 'Welcome to {{appName}}!',
        html: `
        <h1>Welcome, {{name}}!</h1>
        <p>Thank you for joining {{appName}}.</p>
        <p>We're excited to have you on board!</p>
      `,
        text: "Welcome, {{name}}! Thank you for joining {{appName}}. We're excited to have you on board!",
      },
      passwordReset: {
        subject: 'Password Reset Request',
        html: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="{{resetUrl}}">Reset Password</a>
        <p>This link will expire in {{expirationTime}}.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
      `,
        text: 'Password Reset Request. Click this link to reset your password: {{resetUrl}}. This link will expire in {{expirationTime}}.',
      },
      emailVerification: {
        subject: 'Email Verification Required',
        html: `
        <h1>Email Verification</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{{verificationUrl}}">Verify Email</a>
        <p>This link will expire in {{expirationTime}}.</p>
      `,
        text: 'Please verify your email address by clicking this link: {{verificationUrl}}. This link will expire in {{expirationTime}}.',
      },
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Replace variables in all template parts
    const replaceVariables = (content: string): string => {
      Object.keys(context).forEach((key) => {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(context[key]));
      });
      return content;
    };

    return {
      subject: replaceVariables(template.subject),
      html: replaceVariables(template.html),
      ...(template.text && { text: replaceVariables(template.text) }),
    };
  }
}
