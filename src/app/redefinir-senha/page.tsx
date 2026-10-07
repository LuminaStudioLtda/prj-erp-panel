import Link from "next/link";

import { AuthCard } from "@/features/auth/components/AuthCard";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { isResetTokenValid } from "@/features/auth/services/password-reset";

export const metadata = {
  title: "Redefinir senha · Lumina ERP",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/redefinir-senha">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const valid = token ? await isResetTokenValid(token) : false;

  if (!valid) {
    return (
      <AuthCard
        title="Link inválido"
        description="Este link de redefinição expirou ou já foi usado."
      >
        <Link
          href="/recuperar-senha"
          className="text-sm font-medium text-ink underline"
        >
          Solicitar um novo link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Nova senha"
      description="Escolha uma nova senha com pelo menos 8 caracteres."
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
