// lib/mail.ts
import nodemailer from "nodemailer";

type SendResult = {
  ok: boolean;
  previewUrl?: string | null;
  error?: string | null;
};

export async function sendMailDevOrProd(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}): Promise<SendResult> {
  const { to, subject, text, html } = opts;
  const from = opts.from ?? process.env.EMAIL_FROM ?? "no-reply@localhost";

  // If SMTP envs are set, use them for real sending
  const hasSmtp =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS &&
    !!process.env.SMTP_PORT;

  try {
    if (hasSmtp && process.env.NODE_ENV === "production") {
      // Production: use real SMTP configured in env
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Boolean(process.env.SMTP_SECURE === "true"), // optional
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      return { ok: true, previewUrl: null };
    } else {
      // Dev fallback: use nodemailer test account + return preview URL
      const testAccount = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || null;
      return { ok: true, previewUrl };
    }
  } catch (err: any) {
    console.error("sendMailDevOrProd error:", err);
    return { ok: false, error: err?.message ?? String(err) };
  }
}
