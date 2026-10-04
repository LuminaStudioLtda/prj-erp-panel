import type { ReactNode } from "react";
import { BanknoteIcon, ClipboardListIcon, PackageCheckIcon, TimerIcon } from "lucide-react";
import { formatarMoeda } from "@/lib/formatar";
import type { IndicadoresDePedidos } from "@/features/pedidos/services/pedido-indicadores";

function Cartao({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-xl bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{titulo}</span>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-terracotta">{icone}</div>
      </div>
      {children}
    </article>
  );
}

export function PedidosKpiCards({ indicadores }: { indicadores: IndicadoresDePedidos }) {
  return (
    <section aria-label="Indicadores de pedidos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Cartao titulo="Total de pedidos" icone={<ClipboardListIcon className="size-5" aria-hidden="true" />}>
        <span className="text-4xl leading-none font-semibold text-terracotta">{indicadores.total}</span>
        <p className="text-xs text-muted-foreground">Todos os status, incluindo rascunhos.</p>
      </Cartao>
      <Cartao titulo="Em confecção" icone={<TimerIcon className="size-5" aria-hidden="true" />}>
        <span className="text-4xl leading-none font-semibold text-terracotta">{indicadores.emConfeccao}</span>
        <p className="text-xs text-muted-foreground">Materiais já baixados do estoque.</p>
      </Cartao>
      <Cartao titulo="Entregas do mês" icone={<PackageCheckIcon className="size-5" aria-hidden="true" />}>
        <span className="text-4xl leading-none font-semibold text-terracotta">{indicadores.entregasDoMes}</span>
        <p className="text-xs text-muted-foreground">Prazo previsto neste mês (sem cancelados e rascunhos).</p>
      </Cartao>
      <Cartao titulo="Faturamento previsto" icone={<BanknoteIcon className="size-5" aria-hidden="true" />}>
        <span className="font-mono text-3xl leading-none font-semibold text-terracotta">
          {formatarMoeda(indicadores.faturamentoPrevisto)}
        </span>
        <p className="text-xs text-muted-foreground">Soma dos pedidos em aberto.</p>
      </Cartao>
    </section>
  );
}
