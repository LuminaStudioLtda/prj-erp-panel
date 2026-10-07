import { AdminNav } from "@/features/admin-layout/components/AdminNav";
import { OfficeStatusCard } from "@/features/admin-layout/components/OfficeStatusCard";

export function SidebarContent() {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-3 pt-2">
        <p className="font-heading text-2xl font-semibold">Lumina</p>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">
          Oficina
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AdminNav />
      </div>
      <OfficeStatusCard />
    </div>
  );
}
