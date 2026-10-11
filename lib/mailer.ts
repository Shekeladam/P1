import nodemailer from "nodemailer";

// Sends through the user's own Gmail account via an App Password —
// https://myaccount.google.com/apppasswords — not the regular account password.
function getTransport() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not set");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
}

export const sendDigestEmail = sendEmail;
