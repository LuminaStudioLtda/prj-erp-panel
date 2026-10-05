import { cn } from "@/lib/utils";
import { ROTULO_DO_STATUS } from "@/features/pedidos/services/pedido-status";
import type { StatusDoPedido } from "@/features/pedidos/types";

const CLASSE: Record<StatusDoPedido, string> = {
  DRAFT: "bg-border text-muted-foreground",
  AWAITING_PAYMENT: "bg-ochre/20 text-ochre-foreground",
  AWAITING_PRODUCTION: "bg-ochre/20 text-ochre-foreground",
  IN_PRODUCTION: "bg-terracotta/15 text-terracotta",
  READY_TO_SHIP: "bg-sage/20 text-sage-foreground",
  SHIPPED: "bg-ink/10 text-ink",
  COMPLETED: "bg-sage/20 text-sage-foreground",
  CANCELLED: "bg-critical/10 text-critical",
};

export function StatusDoPedidoBadge({ status, className }: { status: StatusDoPedido; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center rounded-full px-2 text-xs font-semibold whitespace-nowrap",
        CLASSE[status],
        className,
      )}
    >
      {ROTULO_DO_STATUS[status]}
    </span>
  );
}
