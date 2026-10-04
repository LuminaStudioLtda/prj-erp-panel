import type { ReactNode } from "react";
import { BanknoteIcon, HourglassIcon, TimerIcon, TriangleAlertIcon } from "lucide-react";
import { formatarMoeda, formatarPercentual } from "@/lib/formatar";
import type { ResumoDoMes } from "@/features/dashboard/types";

type DashboardKpiCardsProps = {
  resumo: ResumoDoMes;
  fiosEmAlerta: number;
};

function Cartao({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-xl bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{titulo}</span>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-terracotta">
          {icone}
        </div>
      </div>
      {children}
    </article>
  );
}

export function DashboardKpiCards({ resumo, fiosEmAlerta }: DashboardKpiCardsProps) {
  const { variacao } = resumo;

  return (
    <section aria-label="Indicadores do ateliê" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Cartao titulo="Rendimento do mês" icone={<BanknoteIcon className="size-5" aria-hidden="true" />}>
        <span className="font-mono text-3xl leading-none font-semibold text-terracotta">
          {formatarMoeda(resumo.faturamento)}
        </span>
        <p className="text-xs text-muted-foreground">
          {variacao === null
            ? "Sem faturamento no mês anterior para comparar."
            : `${variacao >= 0 ? "▲" : "▼"} ${formatarPercentual(Math.abs(variacao))} vs. mês anterior`}
        </p>
      </Cartao>

      <Cartao titulo="Produção ativa" icone={<TimerIcon className="size-5" aria-hidden="true" />}>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl leading-none font-semibold text-terracotta">{resumo.emProducao.pecas}</span>
          <span className="text-muted-foreground">peças na agulha</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {resumo.emProducao.pedidos} {resumo.emProducao.pedidos === 1 ? "pedido" : "pedidos"} em confecção
        </p>
      </Cartao>

      <Cartao titulo="Aguardando pagamento" icone={<HourglassIcon className="size-5" aria-hidden="true" />}>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl leading-none font-semibold text-terracotta">
            {resumo.aguardandoPagamento.pedidos}
          </span>
          <span className="text-muted-foreground">
            {resumo.aguardandoPagamento.pedidos === 1 ? "pedido" : "pedidos"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatarMoeda(resumo.aguardandoPagamento.total)} ainda não confirmados
        </p>
      </Cartao>

      <Cartao titulo="Alertas de estoque" icone={<TriangleAlertIcon className="size-5" aria-hidden="true" />}>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-4xl leading-none font-semibold ${fiosEmAlerta > 0 ? "text-critical" : "text-sage-foreground"}`}
          >
            {fiosEmAlerta}
          </span>
          <span className="text-muted-foreground">{fiosEmAlerta === 1 ? "fio" : "fios"}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {fiosEmAlerta > 0 ? "Abaixo ou perto do ponto de pedido." : "Todos os fios acima do ponto de pedido."}
        </p>
      </Cartao>
    </section>
  );
}
