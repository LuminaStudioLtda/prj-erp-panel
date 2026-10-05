"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { loginAction, type LoginState } from "@/features/auth/actions/auth-actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const errors = state.errors ?? {};

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse o painel da Lumina.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" action={formAction} noValidate>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p className="text-sm text-destructive" id="email-error">
                {errors.email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password ? (
              <p className="text-sm text-destructive" id="password-error">
                {errors.password}
              </p>
            ) : null}
          </div>
          {errors.form ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.form}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
