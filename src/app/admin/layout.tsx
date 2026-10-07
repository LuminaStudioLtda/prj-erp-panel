import { requireAdmin } from "@/features/auth/services/require-admin";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}
