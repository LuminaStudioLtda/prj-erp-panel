import { AdminHeader } from "@/features/admin-layout/components/AdminHeader";
import { MobileNavDrawer } from "@/features/admin-layout/components/MobileNavDrawer";
import { SidebarContent } from "@/features/admin-layout/components/SidebarContent";
import type { CurrentUser } from "@/features/auth/types";

export function AdminShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-canvas">
      <aside
        aria-label="Barra lateral"
        className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 border-r border-border bg-surface md:block"
      >
        <SidebarContent />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          user={user}
          menu={
            <MobileNavDrawer>
              <SidebarContent />
            </MobileNavDrawer>
          }
        />
        <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
