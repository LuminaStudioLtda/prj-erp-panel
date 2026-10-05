import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DashboardKpiCards } from "@/features/dashboard/components/DashboardKpiCards";
import { EstoqueDeFios } from "@/features/dashboard/components/EstoqueDeFios";
import { FaturamentoChart } from "@/features/dashboard/components/FaturamentoChart";
import { FilaDeConfeccao } from "@/features/dashboard/components/FilaDeConfeccao";
import { PedidosPorStatusChart } from "@/features/dashboard/components/PedidosPorStatusChart";
import { listarPedidosDoDashboard } from "@/features/dashboard/services/dashboard-pedidos-db";
import {
  calcularResumoDoMes,
  calcularSerieDeFaturamento,
  contarAlertasDeFios,
  contarPedidosPorStatus,
  listarFiosEmDestaque,
  montarFilaDeConfeccao,
} from "@/features/dashboard/services/dashboard-resumo";
import { listarInsumos } from "@/features/insumos/services/insumos-db";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
};

export default async function DashboardPage() {
  const agora = new Date();
  const ator = await getAuthenticatedUser();
  const [{ pedidos, bancoDisponivel }, { insumos }] = await Promise.all([
    listarPedidosDoDashboard(ator, agora),
    listarInsumos(ator),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-widest text-terracotta uppercase">
            Dashboard geral
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">Rendimento do ateliê</h1>
          <p className="max-w-2xl text-muted-foreground">
            Faturamento, produção e estoque em um só lugar: o que entrou, o que está na agulha e o que precisa
            ser reposto.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/insumos" className={cn(buttonVariants({ variant: "outline" }))}>
            Entrada de insumo
          </Link>
          <Link href="/admin/receitas" className={cn(buttonVariants())}>
            Novo cadastro de produto
          </Link>
        </div>
      </header>

      <DashboardKpiCards
        resumo={calcularResumoDoMes(pedidos, agora)}
        fiosEmAlerta={contarAlertasDeFios(insumos)}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <div className="flex flex-col gap-6">
          <FaturamentoChart serie={calcularSerieDeFaturamento(pedidos, agora)} />
          <FilaDeConfeccao fila={montarFilaDeConfeccao(pedidos)} bancoDisponivel={bancoDisponivel} />
        </div>
        <div className="flex flex-col gap-6">
          <PedidosPorStatusChart contagem={contarPedidosPorStatus(pedidos)} />
          <EstoqueDeFios fios={listarFiosEmDestaque(insumos)} />
        </div>
      </div>
    </div>
  );
}
