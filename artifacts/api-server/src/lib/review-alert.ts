import nodemailer from "nodemailer";
import type { Logger } from "pino";

export async function sendReviewAlert(
  review: { name: string; rating: number; message: string },
  log: Logger,
): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const username = process.env.SMTP_USERNAME?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim();
  const recipient = process.env.OWNER_ALERT_EMAIL?.trim();

  if (!host || !Number.isFinite(port) || port <= 0 || !from || !recipient) {
    log.warn("Review saved, but email alert is not configured; set SMTP_HOST, SMTP_PORT, SMTP_FROM, and OWNER_ALERT_EMAIL");
    return;
  }
  if ((username && !password) || (!username && password)) {
    log.warn("Review saved, but SMTP authentication is incomplete");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    ...(username && password ? { auth: { user: username, pass: password } } : {}),
  });

  try {
    await transporter.sendMail({
      from,
      to: recipient,
      subject: "A new Afternoons Cafe review is waiting",
      text: [
        `A new ${review.rating}-star review from ${review.name} is waiting for approval.`,
        "",
        review.message,
        "",
        "Open the Afternoons Cafe admin page to approve or reject it.",
      ].join("\n"),
    });
  } catch (error) {
    log.error({ err: error }, "Review was saved, but the owner email alert could not be sent");
  } finally {
    transporter.close();
  }
}
