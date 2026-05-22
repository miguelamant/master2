import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendConsumerOtp(toEmail, code) {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #111827; margin: 0 0 8px;">Sign in to Willy</h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        Enter this code to verify your email address.
      </p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111827;">${code}</span>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This code expires in 10 minutes. If you didn't request this, you can ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Willy" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your Willy sign-in code: ${code}`,
    html,
  });
}

export async function sendVerificationCode(toEmail, code, venueName) {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #111827; margin: 0 0 8px;">Verify your venue</h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        Use the code below to claim <strong>${venueName}</strong> on Foodbase.
      </p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111827;">${code}</span>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This code expires in 10 minutes. If you didn't request this, you can ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Foodbase" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your Foodbase verification code: ${code}`,
    html,
  });
}
