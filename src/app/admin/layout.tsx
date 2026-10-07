import { AdminShell } from "@/features/admin-layout/components/AdminShell";
import { requireAdmin } from "@/features/auth/services/require-admin";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
