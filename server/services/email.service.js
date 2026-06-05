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

export async function sendPlonsremorkBevestiging(toEmail, naam, r) {
  const typeLabel = r.type === "afhalen" ? "Zelf afhalen (1 Meilaan, Leuven)" : `Levering op locatie (${r.adres})`;
  const periodeLabel = r.periode === "3dagen" ? "3 dagen" : "1 week";
  const prijs = r.type === "afhalen"
    ? (r.periode === "3dagen" ? "€100" : "€150")
    : (r.periode === "3dagen" ? "€200" : "€250");

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1b4d6e; margin: 0 0 8px;">Bedankt voor je aanvraag, ${naam}!</h2>
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">
        We hebben je reservatieaanvraag goed ontvangen en nemen zo snel mogelijk contact op ter bevestiging.
      </p>
      <div style="background: #f0f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px;"><strong>Type:</strong> ${typeLabel}</p>
        <p style="margin: 0 0 8px;"><strong>Periode:</strong> ${periodeLabel}</p>
        <p style="margin: 0 0 8px;"><strong>Van:</strong> ${r.start_datum}</p>
        <p style="margin: 0 0 8px;"><strong>Tot:</strong> ${r.eind_datum}</p>
        <p style="margin: 0;"><strong>Prijs:</strong> ${prijs}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Eventus — plonsremork@eventus.be
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Eventus Plonsremork" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Reservatieaanvraag ontvangen – Plonsremork",
    html,
  });
}

export async function sendPlonsremorkNotificatie(r) {
  const html = `
    <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h3 style="color: #1b4d6e;">Nieuwe Plonsremork reservatieaanvraag</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Naam</td><td>${r.naam}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Email</td><td>${r.email}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Telefoon</td><td>${r.telefoon}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Type</td><td>${r.type}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Periode</td><td>${r.periode}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Van</td><td>${r.start_datum}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Tot</td><td>${r.eind_datum}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Adres</td><td>${r.adres || '—'}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Bericht</td><td>${r.bericht || '—'}</td></tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: `"Eventus Plonsremork" <${env.GMAIL_USER}>`,
    to: "miguelamant@gmail.com",
    subject: `Nieuwe aanvraag: ${r.naam} – ${r.start_datum}`,
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
