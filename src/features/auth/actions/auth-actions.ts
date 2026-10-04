"use server";

import { redirect } from "next/navigation";
import { validateEmail, validatePassword } from "@/features/auth/services/auth-service";
import { endSession, startSession } from "@/lib/auth/session";

export type LoginState = {
  errors?: Partial<Record<"email" | "password" | "form", string>>;
  email?: string;
};

function safeNext(value: FormDataEntryValue | null): string {
  return typeof value === "string" && /^\/admin(\/[\w-]*)*$/.test(value) ? value : "/admin";
}

// Login de desenvolvimento: aceita qualquer email/senha válidos, sem consultar o banco.
export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const errors: NonNullable<LoginState["errors"]> = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (emailError || passwordError) return { errors, email };

  const started = await startSession({ id: email, name: email.split("@")[0], role: "ADMIN" });
  if (!started) {
    return { errors: { form: "SESSION_SECRET não configurado (mínimo de 32 caracteres)." }, email };
  }

  redirect(safeNext(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}
