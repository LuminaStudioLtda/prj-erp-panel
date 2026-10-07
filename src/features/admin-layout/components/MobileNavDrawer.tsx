"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Drawer exibido abaixo de md. Fecha ao navegar, com Esc ou ao tocar no fundo. */
export function MobileNavDrawer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="admin-drawer"
        onClick={() => setOpenPath(pathname)}
      >
        <MenuIcon aria-hidden="true" />
      </Button>

      <div
        aria-hidden="true"
        onClick={() => setOpenPath(null)}
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="admin-drawer"
        aria-label="Menu do painel"
        inert={!open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-surface transition-transform duration-200 motion-reduce:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar menu"
          className="absolute top-2 right-2"
          onClick={() => setOpenPath(null)}
        >
          <XIcon aria-hidden="true" />
        </Button>
        {children}
      </aside>
    </div>
  );
}
