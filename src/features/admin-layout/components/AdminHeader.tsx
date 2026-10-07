import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import type { CurrentUser } from "@/features/auth/types";

export function AdminHeader({
  user,
  menu,
}: {
  user: CurrentUser;
  menu: React.ReactNode;
}) {
  return (
    <header className="flex min-h-16 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      {menu}
      <div className="ml-auto flex items-center gap-3">
        <div className="min-w-0 text-right leading-tight">
          <p className="max-w-32 truncate text-sm font-medium sm:max-w-64">
            {user.name}
          </p>
          <p className="text-xs text-muted">Administrador</p>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size="icon"
            aria-label="Sair"
            title="Sair"
          >
            <LogOutIcon aria-hidden="true" />
          </Button>
        </form>
      </div>
    </header>
  );
}
