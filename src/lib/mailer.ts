import { headers } from "next/headers";
import nodemailer from "nodemailer";

export type MailResult = "sent" | "not-configured";

type Mail = { to: string; subject: string; text: string };

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return {
    from,
    transport: {
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    },
  };
}

/** Envia por SMTP. Sem SMTP configurado, registra o conteúdo no log do servidor. */
export async function sendMail({
  to,
  subject,
  text,
}: Mail): Promise<MailResult> {
  const config = getSmtpConfig();
  if (!config) {
    console.info(
      `[mail] SMTP não configurado. Para: ${to}\n${subject}\n${text}`,
    );
    return "not-configured";
  }

  await nodemailer
    .createTransport(config.transport)
    .sendMail({ from: config.from, to, subject, text });
  return "sent";
}

/** URL base do app: APP_URL ou, na falta dela, o host da requisição. */
export async function getAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
