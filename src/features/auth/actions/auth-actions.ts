"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { verifyPassword } from "@/features/auth/services/password";
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

  let user;
  try {
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
    return failure({
      code: "UNAUTHENTICATED",
      message: "E-mail ou senha inválidos.",
    });
  }

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
