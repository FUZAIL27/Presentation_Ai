import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

async function sendMail(options: MailOptions): Promise<void> {
  const t = getTransporter();

  if (!t) {
    logger.warn(
      `[email:not-configured] Would send email to ${options.to} — subject: "${options.subject}". ` +
        `Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to actually deliver emails.`,
    );
    logger.debug(`[email:body] ${options.html}`);
    return;
  }

  await t.sendMail({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Verify your PresentAI account',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#6366f1;">Welcome to PresentAI, ${name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
          border-radius:8px;text-decoration:none;font-weight:600;">Verify Email</a>
        <p style="margin-top:16px;color:#666;font-size:13px;">This link expires in 24 hours. If you didn't create
          this account, you can safely ignore this email.</p>
      </div>`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Reset your PresentAI password',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#6366f1;">Password Reset Request</h2>
        <p>Hi ${name}, we received a request to reset your password.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
          border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="margin-top:16px;color:#666;font-size:13px;">This link expires in 15 minutes. If you didn't
          request this, you can safely ignore this email.</p>
      </div>`,
  });
}
