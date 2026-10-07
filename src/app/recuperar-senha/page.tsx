import Link from "next/link";

import { AuthCard } from "@/features/auth/components/AuthCard";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata = { title: "Recuperar senha · Lumina ERP" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe seu e-mail para receber o link de redefinição."
    >
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-muted">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-medium text-ink underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
