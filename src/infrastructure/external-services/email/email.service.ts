import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailService } from '../../../domain/services/email.service.interface';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    // Try to get SMTP configuration from multiple possible env var formats
    const host = this.configService.get<string>('SMTP_HOST') || this.configService.get<string>('EMAIL_SERVICE_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || this.configService.get<number>('EMAIL_SERVICE_PORT');
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_SERVICE_USER');
    const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('EMAIL_SERVICE_PASS');

    // If SMTP is not configured, use a mock transporter for development
    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration not found. Using mock email service for development.');
      return nodemailer.createTransporter({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }

    this.logger.log('Configuring SMTP email service');
    return nodemailer.createTransporter({
      host,
      port: port || 587,
      secure: false,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('EMAIL_SERVICE_FROM') || 'noreply@yourapp.com';
      
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      // If using mock transporter, log the email content
      if (info.message) {
        this.logger.log(`Mock email sent to ${to}: ${subject}`);
        this.logger.debug(`Email content: ${info.message.toString()}`);
      } else {
        this.logger.log(`Email sent successfully to ${to}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
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

    await this.sendEmail(to, subject, html);
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

    await this.sendEmail(to, subject, html);
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

    await this.sendEmail(to, subject, html);
  }
}
