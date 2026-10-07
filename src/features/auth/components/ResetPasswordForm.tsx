"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/features/auth/actions/password-reset-actions";
import { AuthField } from "@/features/auth/components/AuthField";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    null,
  );
  const error = state && !state.ok ? state.error : null;
  const formError = error && !error.fieldErrors ? error.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="token" value={token} />

      <AuthField
        id="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        required
        error={error?.fieldErrors?.password?.[0]}
      />
      <AuthField
        id="confirmPassword"
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        required
        error={error?.fieldErrors?.confirmPassword?.[0]}
      />

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
