import type { PedidosPorStatus } from "@/features/dashboard/types";
import type { StatusDoPedido } from "@/features/pedidos/types";

const CIRCUNFERENCIA = 100;

const COR_DO_STATUS: Record<StatusDoPedido, { traco: string; ponto: string }> = {
  DRAFT: { traco: "stroke-muted-foreground", ponto: "bg-muted-foreground" },
  AWAITING_PRODUCTION: { traco: "stroke-ochre-foreground", ponto: "bg-ochre-foreground" },
  AWAITING_PAYMENT: { traco: "stroke-ochre", ponto: "bg-ochre" },
  IN_PRODUCTION: { traco: "stroke-terracotta", ponto: "bg-terracotta" },
  READY_TO_SHIP: { traco: "stroke-sage", ponto: "bg-sage" },
  SHIPPED: { traco: "stroke-ink", ponto: "bg-ink" },
  COMPLETED: { traco: "stroke-sage-foreground", ponto: "bg-sage-foreground" },
  CANCELLED: { traco: "stroke-critical", ponto: "bg-critical" },
};

export function PedidosPorStatusChart({ contagem }: { contagem: PedidosPorStatus[] }) {
  const total = contagem.reduce((soma, item) => soma + item.quantidade, 0);

  const arcos = contagem.map((item, indice) => {
    const fracaoDe = (quantidade: number) => (total > 0 ? (quantidade / total) * CIRCUNFERENCIA : 0);
    const anteriores = contagem.slice(0, indice).reduce((soma, anterior) => soma + fracaoDe(anterior.quantidade), 0);
    return { ...item, fracao: fracaoDe(item.quantidade), deslocamento: -anteriores };
  });

  return (
    <section aria-label="Pedidos por status" className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-sm">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-lg font-semibold text-ink">Pedidos por status</h2>
        <p className="text-sm text-muted-foreground">Mês atual, mês anterior e pedidos em aberto.</p>
      </header>

      <div className="flex items-center gap-5">
        <div className="relative size-32 shrink-0">
          <svg
            viewBox="0 0 36 36"
            className="size-full -rotate-90"
            role="img"
            aria-label={`${total} pedidos distribuídos por status`}
          >
            <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4" className="stroke-border" />
            {arcos.map((arco) =>
              arco.fracao > 0 ? (
                <circle
                  key={arco.status}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  strokeWidth="4"
                  pathLength={CIRCUNFERENCIA}
                  strokeDasharray={`${arco.fracao} ${CIRCUNFERENCIA - arco.fracao}`}
                  strokeDashoffset={arco.deslocamento}
                  className={COR_DO_STATUS[arco.status].traco}
                />
              ) : null,
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="font-mono text-xl font-semibold text-ink">{total}</span>
            <span className="text-[10px] text-muted-foreground">pedidos</span>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-1.5 text-xs">
          {contagem.map((item) => (
            <li key={item.status} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${COR_DO_STATUS[item.status].ponto}`} />
                {item.rotulo}
              </span>
              <span className="font-mono text-ink">{item.quantidade}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
