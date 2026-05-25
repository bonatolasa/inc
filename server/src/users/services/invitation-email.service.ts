import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class InvitationEmailService {
  private readonly logger = new Logger(InvitationEmailService.name);

  private transporter: nodemailer.Transporter | null = null;
  private smtpConfigured = true;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    if (!this.smtpConfigured) {
      return null;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<number>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure =
      this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465;
    const requireTLS =
      this.configService.get<string>('SMTP_REQUIRE_TLS') !== 'false';
    const authMethod = this.configService.get<string>('SMTP_AUTH_METHOD');
    const rejectUnauthorized =
      this.configService.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false';
    const debug = this.configService.get<string>('SMTP_DEBUG') === 'true';
    const connectionTimeout = Number(
      this.configService.get<number>('SMTP_CONNECTION_TIMEOUT') ?? 10000,
    );
    const greetingTimeout = Number(
      this.configService.get<number>('SMTP_GREETING_TIMEOUT') ?? 10000,
    );
    const socketTimeout = Number(
      this.configService.get<number>('SMTP_SOCKET_TIMEOUT') ?? 10000,
    );

    if (!host || !user || !pass) {
      this.smtpConfigured = false;
      return null;
    }

    try {
      const transporterOptions: any = {
        host,
        port,
        secure,
        auth: { user, pass },
        requireTLS,
        tls: rejectUnauthorized ? undefined : { rejectUnauthorized: false },
        logger: debug,
        debug,
        connectionTimeout,
        greetingTimeout,
        socketTimeout,
      };

      if (authMethod) {
        transporterOptions.authMethod = authMethod;
      }

      this.transporter = nodemailer.createTransport(transporterOptions);
      return this.transporter;
    } catch (error: any) {
      this.logger.error(`Failed to initialize SMTP transporter: ${error?.message || 'unknown error'}`);
      return null;
    }
  }

  async sendInviteEmail(email: string, name: string, inviteLink: string): Promise<boolean> {
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.warn(
        `SMTP is not configured in .env. Invite email not sent to ${email}. Activation link: ${inviteLink}`,
      );
      return false;
    }

    const user = this.configService.get<string>('SMTP_USER');
    const from =
      this.configService.get<string>('SMTP_FROM') || user || 'no-reply@example.com';

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'You are invited to join the platform',
        text: `Hi ${name},\n\nYou have been invited to join the platform.\nSet your password using this link:\n${inviteLink}\n\nThis link expires in 24 hours.`,
        html: `<p>Hi ${name},</p><p>You have been invited to join the platform.</p><p><a href="${inviteLink}">Set your password</a></p><p>This link expires in 24 hours.</p>`,
      });

      this.logger.log(`Invite email sent to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `SMTP send failed for ${email}: ${error?.message || 'unknown error'}`,
      );
      return false;
    }
  }
}
