import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export type RateLimitRule = {
  key: string;
  max: number;
  windowMs: number;
};

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const RESET_WINDOW_MS = 60 * 60 * 1000;

/** Segundos até liberar a regra; 0 quando ainda há tentativas disponíveis. */
export async function getRetryAfterSeconds({
  key,
  max,
  windowMs,
}: RateLimitRule) {
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!row) return 0;

  const elapsed = Date.now() - row.windowStartedAt.getTime();
  if (elapsed >= windowMs || row.attempts < max) return 0;
  return Math.ceil((windowMs - elapsed) / 1000);
}

/** Maior espera entre as regras informadas. */
export async function getRetryAfterForRules(rules: RateLimitRule[]) {
  const waits = await Promise.all(rules.map(getRetryAfterSeconds));
  return Math.max(0, ...waits);
}

export async function recordAttempt({
  key,
  windowMs,
}: Pick<RateLimitRule, "key" | "windowMs">) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const row = await tx.authRateLimit.findUnique({ where: { key } });
    const expired =
      !row || now.getTime() - row.windowStartedAt.getTime() >= windowMs;

    if (expired) {
      await tx.authRateLimit.upsert({
        where: { key },
        create: { key, attempts: 1, windowStartedAt: now },
        update: { attempts: 1, windowStartedAt: now },
      });
    } else {
      await tx.authRateLimit.update({
        where: { key },
        data: { attempts: { increment: 1 } },
      });
    }
  });
}

export async function recordAttempts(
  rules: Pick<RateLimitRule, "key" | "windowMs">[],
) {
  for (const rule of rules) await recordAttempt(rule);
}

export async function clearAttempts(key: string) {
  await prisma.authRateLimit.deleteMany({ where: { key } });
}

export function rateLimitMessage(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Muitas tentativas. Tente novamente em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
}

export async function getClientIp() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || "local";
}
