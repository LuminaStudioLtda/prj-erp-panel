"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword } from "@/features/auth/services/password";
import { setSessionCookie } from "@/features/auth/services/session-cookie";
import { failure, type ActionResult } from "@/lib/action-result";
import { toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(160),
    email: z.email("Informe um e-mail válido."),
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

export async function signupAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return toActionError(parsed.error);

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  let userId: string;
  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
    if (existing?.passwordHash) {
      return failure({
        code: "CONFLICT",
        message: "Este e-mail já está cadastrado.",
      });
    }

    // Papel nunca vem do formulário. Um perfil pré-existente sem senha
    // (ex.: ADMIN criado previamente) apenas recebe a senha, mantendo o papel.
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email },
      create: { name, email, passwordHash, role: "CLIENT" },
      update: { passwordHash },
      select: { id: true },
    });
    userId = user.id;
  } catch (cause) {
    return toActionError(cause);
  }

  if (!(await setSessionCookie(userId))) {
    return failure({
      code: "INTERNAL",
      message: "Sessão não configurada (SESSION_SECRET).",
    });
  }
  redirect("/");
}
