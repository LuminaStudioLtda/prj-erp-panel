"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  consumeResetToken,
  createPasswordResetToken,
} from "@/features/auth/services/password-reset";
import {
  clearAttempts,
  getClientIp,
  getRetryAfterForRules,
  RESET_WINDOW_MS,
  rateLimitMessage,
  recordAttempts,
} from "@/features/auth/services/rate-limit";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { toActionError } from "@/lib/errors";
import { getAppUrl, sendMail } from "@/lib/mailer";

const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_PER_IP = 10;

const forgotSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

/** `devLink` só é preenchido em desenvolvimento e sem SMTP configurado. */
export type ForgotPasswordData = { devLink: string | null };

export async function forgotPasswordAction(
  _previous: ActionResult<ForgotPasswordData> | null,
  formData: FormData,
): Promise<ActionResult<ForgotPasswordData>> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return toActionError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();
  const emailKey = `forgot:email:${email}`;
  const ipKey = `forgot:ip:${ip}`;

  try {
    const retryAfter = await getRetryAfterForRules([
      { key: emailKey, max: MAX_REQUESTS_PER_EMAIL, windowMs: RESET_WINDOW_MS },
      { key: ipKey, max: MAX_REQUESTS_PER_IP, windowMs: RESET_WINDOW_MS },
    ]);
    if (retryAfter > 0) {
      return failure({
        code: "RATE_LIMITED",
        message: rateLimitMessage(retryAfter),
      });
    }
    await recordAttempts([
      { key: emailKey, windowMs: RESET_WINDOW_MS },
      { key: ipKey, windowMs: RESET_WINDOW_MS },
    ]);

    // A resposta é a mesma exista ou não a conta, para não revelar cadastros.
    const token = await createPasswordResetToken(email);
    let devLink: string | null = null;
    if (token) {
      const link = `${await getAppUrl()}/redefinir-senha?token=${token}`;
      const result = await sendMail({
        to: email,
        subject: "Redefinição de senha - Lumina",
        text: `Recebemos um pedido para redefinir sua senha.\n\nAcesse o link (válido por 1 hora):\n${link}\n\nSe não foi você, ignore este e-mail.`,
      });
      if (
        result === "not-configured" &&
        process.env.NODE_ENV === "development"
      ) {
        devLink = link;
      }
    }
    return success({ devLink });
  } catch (cause) {
    return toActionError(cause);
  }
}

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "A senha deve ter ao menos 8 caracteres.")
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

const MAX_RESET_FAILURES_PER_IP = 10;

export async function resetPasswordAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return toActionError(parsed.error);

  const ip = await getClientIp();
  const ipKey = `reset:ip:${ip}`;

  let email: string | null;
  try {
    const retryAfter = await getRetryAfterForRules([
      { key: ipKey, max: MAX_RESET_FAILURES_PER_IP, windowMs: RESET_WINDOW_MS },
    ]);
    if (retryAfter > 0) {
      return failure({
        code: "RATE_LIMITED",
        message: rateLimitMessage(retryAfter),
      });
    }

    email = await consumeResetToken(parsed.data.token, parsed.data.password);
    if (!email) {
      await recordAttempts([{ key: ipKey, windowMs: RESET_WINDOW_MS }]);
      return failure({
        code: "VALIDATION",
        message: "Link inválido ou expirado. Solicite um novo.",
      });
    }

    // Quem acabou de provar posse do e-mail pode tentar entrar de novo.
    await clearAttempts(`login:email:${email}`);
  } catch (cause) {
    return toActionError(cause);
  }

  redirect("/login?senha=redefinida");
}
