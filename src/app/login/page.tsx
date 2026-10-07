import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/features/auth/services/current-user";
import { safeRedirectPath } from "@/features/auth/services/safe-redirect";

export const metadata = { title: "Entrar · Lumina ERP" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const semPermissao = params.erro === "sem-permissao";

  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect(safeRedirectPath(next, "/admin"));

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-10">
        <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
          Lumina
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-2 mb-8 text-sm text-muted">
          Acesse o painel administrativo da oficina.
        </p>
        {semPermissao ? (
          <p role="alert" className="mb-6 text-sm text-destructive">
            Esta conta não tem permissão para acessar o painel.
          </p>
        ) : null}
        <LoginForm next={next} />
        <p className="mt-6 text-sm text-muted">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-ink underline">
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
