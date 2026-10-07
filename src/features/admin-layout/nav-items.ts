import {
  BookOpenIcon,
  CalculatorIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  Package2Icon,
  TimerIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard Geral", href: "/admin", icon: LayoutDashboardIcon },
  { label: "Gestão de Insumos", href: "/admin/insumos", icon: Package2Icon },
  {
    label: "Gestão de Pedidos",
    href: "/admin/pedidos",
    icon: ClipboardListIcon,
  },
  { label: "Receitas & Produtos", href: "/admin/receitas", icon: BookOpenIcon },
  {
    label: "Motor de Precificação",
    href: "/admin/precificacao",
    icon: CalculatorIcon,
  },
  {
    label: "Fila de Produção",
    href: "/admin/fila-de-producao",
    icon: TimerIcon,
  },
  {
    label: "Alertas de Estoque",
    href: "/admin/alertas-de-estoque",
    icon: TriangleAlertIcon,
  },
];

export function isNavItemActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}
