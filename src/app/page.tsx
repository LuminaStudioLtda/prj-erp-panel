import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import { getCurrentUser } from "@/features/auth/services/current-user";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 text-ink">
      <section className="w-full max-w-xl rounded-xl border border-border bg-surface p-6 sm:p-12">
        <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
          Lumina
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {user ? `Olá, ${user.name}` : "ERP Panel"}
        </h1>
        <p className="mt-4 max-w-prose leading-7 text-muted">
          {user
            ? "Você está conectado."
            : "Entre ou crie uma conta para acessar a Lumina."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link href="/admin" className={buttonVariants({ size: "lg" })}>
                  Ir para o painel
                </Link>
              ) : null}
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="lg">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
