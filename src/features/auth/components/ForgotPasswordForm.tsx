"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "@/features/auth/actions/password-reset-actions";
import { AuthField } from "@/features/auth/components/AuthField";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    null,
  );
  const [email, setEmail] = useState("");
  const error = state && !state.ok ? state.error : null;
  const formError = error && !error.fieldErrors ? error.message : null;

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-4 text-sm">
        <p>
          Se existir uma conta com esse e-mail, enviamos um link para redefinir
          a senha. Ele vale por 1 hora.
        </p>
        {state.data.devLink ? (
          <p className="rounded-lg border border-border bg-canvas p-3 break-all">
            <span className="font-medium">
              Modo desenvolvimento (SMTP não configurado):
            </span>{" "}
            <a href={state.data.devLink} className="underline">
              {state.data.devLink}
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <AuthField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={error?.fieldErrors?.email?.[0]}
      />

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
    </form>
  );
}
