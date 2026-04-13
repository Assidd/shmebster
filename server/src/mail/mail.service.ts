import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.password');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('Mail credentials not configured — emails will be logged to console');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const from = this.configService.get<string>('mail.from', 'noreply@webster.app');

    if (!this.transporter) {
      this.logger.log(`[MAIL] To: ${to} | Subject: ${subject}`);
      this.logger.log(`[MAIL] Body: ${html}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }

  async sendConfirmationEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get<string>('app.url', 'http://localhost');
    const link = `${appUrl}/confirm-email?token=${token}`;

    await this.send(
      email,
      'Confirm your Webster account',
      `
        <h2>Welcome to Webster!</h2>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">
          Confirm Email
        </a>
        <p style="margin-top:16px;color:#666;">Or copy this link: ${link}</p>
      `,
    );
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get<string>('app.url', 'http://localhost');
    const link = `${appUrl}/reset-password?token=${token}`;

    await this.send(
      email,
      'Reset your Webster password',
      `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#666;">This link expires in 1 hour.</p>
        <p style="color:#666;">If you didn't request this, ignore this email.</p>
      `,
    );
  }
}
