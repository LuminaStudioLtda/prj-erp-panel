"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { verifyPassword } from "@/features/auth/services/password";
import {
  clearAttempts,
  getClientIp,
  getRetryAfterForRules,
  LOGIN_WINDOW_MS,
  rateLimitMessage,
  recordAttempts,
} from "@/features/auth/services/rate-limit";
import { safeRedirectPath } from "@/features/auth/services/safe-redirect";
import {
  clearSessionCookie,
  setSessionCookie,
} from "@/features/auth/services/session-cookie";
import { failure, type ActionResult } from "@/lib/action-result";
import { toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 20;

export async function loginAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return toActionError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();
  const emailKey = `login:email:${email}`;
  const ipKey = `login:ip:${ip}`;

  let user;
  try {
    const retryAfter = await getRetryAfterForRules([
      { key: emailKey, max: MAX_ATTEMPTS_PER_EMAIL, windowMs: LOGIN_WINDOW_MS },
      { key: ipKey, max: MAX_ATTEMPTS_PER_IP, windowMs: LOGIN_WINDOW_MS },
    ]);
    if (retryAfter > 0) {
      return failure({
        code: "RATE_LIMITED",
        message: rateLimitMessage(retryAfter),
      });
    }

    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true },
    });
  } catch (cause) {
    return toActionError(cause);
  }

  const valid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? null,
  );
  if (!user || !valid) {
    try {
      await recordAttempts([
        { key: emailKey, windowMs: LOGIN_WINDOW_MS },
        { key: ipKey, windowMs: LOGIN_WINDOW_MS },
      ]);
    } catch (cause) {
      return toActionError(cause);
    }
    return failure({
      code: "UNAUTHENTICATED",
      message: "E-mail ou senha inválidos.",
    });
  }

  await clearAttempts(emailKey);

  if (!(await setSessionCookie(user.id))) {
    return failure({
      code: "INTERNAL",
      message: "Sessão não configurada (SESSION_SECRET).",
    });
  }

  const fallback = user.role === "ADMIN" ? "/admin" : "/";
  redirect(safeRedirectPath(String(formData.get("next") ?? ""), fallback));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
