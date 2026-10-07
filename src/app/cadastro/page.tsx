import Link from "next/link";

import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata = { title: "Criar conta · Lumina ERP" };

export default function SignupPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-10">
        <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
          Lumina
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Criar conta
        </h1>
        <p className="mt-2 mb-8 text-sm text-muted">
          Cadastre-se para acessar a Lumina.
        </p>
        <SignupForm />
        <p className="mt-6 text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-ink underline">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
