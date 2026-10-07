"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupAction } from "@/features/auth/actions/signup-action";

const FIELDS = [
  { name: "name", label: "Nome", type: "text", autoComplete: "name" },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Senha",
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirmar senha",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, null);
  // O React limpa o formulário após cada action; nome e e-mail ficam controlados.
  const [kept, setKept] = useState({ name: "", email: "" });
  const error = state && !state.ok ? state.error : null;
  const formError = error && !error.fieldErrors ? error.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {FIELDS.map(({ name, label, type, autoComplete }) => {
        const fieldError = error?.fieldErrors?.[name]?.[0];
        return (
          <div key={name} className="flex flex-col gap-1.5">
            <label htmlFor={name} className="text-sm font-medium">
              {label}
            </label>
            <Input
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              required
              {...(name === "name" || name === "email"
                ? {
                    value: kept[name],
                    onChange: (event) =>
                      setKept((current) => ({
                        ...current,
                        [name]: event.target.value,
                      })),
                  }
                : {})}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? `${name}-erro` : undefined}
            />
            {fieldError ? (
              <p id={`${name}-erro`} className="text-sm text-destructive">
                {fieldError}
              </p>
            ) : null}
          </div>
        );
      })}

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
