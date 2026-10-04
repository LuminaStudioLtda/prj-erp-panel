import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { canAccessAdmin } from "@/features/rbac/services/access-control";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getAuthenticatedUser();

  if (!user) redirect("/login?next=%2Fadmin");
  if (!canAccessAdmin(user.role)) redirect("/");

  return (
    <AdminShell operador={{ nome: user.name, papel: "Administrador" }}>{children}</AdminShell>
  );
}
