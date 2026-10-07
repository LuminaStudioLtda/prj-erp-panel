import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/current-user";

/** Garante um usuário ADMIN autenticado; caso contrário redireciona ao login. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/login?erro=sem-permissao");
  return user;
}
