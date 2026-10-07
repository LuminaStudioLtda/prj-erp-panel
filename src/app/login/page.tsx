import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/features/auth/components/AuthCard";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/features/auth/services/current-user";
import { safeRedirectPath } from "@/features/auth/services/safe-redirect";

export const metadata = { title: "Entrar · Lumina ERP" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const semPermissao = params.erro === "sem-permissao";
  const senhaRedefinida = params.senha === "redefinida";

  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect(safeRedirectPath(next, "/admin"));

  return (
    <AuthCard
      title="Entrar"
      description="Acesse o painel administrativo da oficina."
    >
      {semPermissao ? (
        <p role="alert" className="mb-6 text-sm text-destructive">
          Esta conta não tem permissão para acessar o painel.
        </p>
      ) : null}
      {senhaRedefinida ? (
        <p role="status" className="mb-6 text-sm text-sage-foreground">
          Senha redefinida. Entre com a nova senha.
        </p>
      ) : null}
      <LoginForm next={next} />
      <p className="mt-6 flex flex-col gap-2 text-sm text-muted">
        <Link
          href="/recuperar-senha"
          className="font-medium text-ink underline"
        >
          Esqueci minha senha
        </Link>
        <span>
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-ink underline">
            Criar conta
          </Link>
        </span>
      </p>
    </AuthCard>
  );
}
