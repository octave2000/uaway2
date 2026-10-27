import nodemailer, { type Transporter } from "nodemailer";
import type { Email } from "./templates";

let transport: Transporter | undefined;

function getTransport() {
  if (transport) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD)
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASSWORD are required.");
  const port = Number(SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    // 465 is implicit TLS; any other port must upgrade with STARTTLS.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    pool: true,
    maxConnections: 3,
  });
  return transport;
}

export async function sendEmail(to: string, email: Email) {
  if (!process.env.AUTH_EMAIL_FROM)
    throw new Error("AUTH_EMAIL_FROM is required.");
  await getTransport().sendMail({
    from: process.env.AUTH_EMAIL_FROM,
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
