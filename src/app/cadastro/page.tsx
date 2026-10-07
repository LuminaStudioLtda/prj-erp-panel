import Link from "next/link";

import { AuthCard } from "@/features/auth/components/AuthCard";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata = { title: "Criar conta · Lumina ERP" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="Cadastre-se para acessar a Lumina."
    >
      <SignupForm />
      <p className="mt-6 text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-ink underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
