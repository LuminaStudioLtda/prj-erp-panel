"use client";

import { useMemo } from "react";
import { AcessoriosSection } from "@/features/insumos/components/AcessoriosSection";
import { CadastrarInsumoDialog } from "@/features/insumos/components/CadastrarInsumoDialog";
import { FichaTecnicaSyncFooter } from "@/features/insumos/components/FichaTecnicaSyncFooter";
import { InsumoKpiCards } from "@/features/insumos/components/InsumoKpiCards";
import { InventoryTable } from "@/features/insumos/components/InventoryTable";
import { cadastrarInsumoAction } from "@/features/insumos/actions/estoque-actions";
import { useAcessoriosMockStore } from "@/features/insumos/hooks/use-acessorios-mock-store";
import { calcularKpis } from "@/features/insumos/services/insumo-estoque";
import type { AcessorioEmEstoque, InsumoEmEstoque, InsumoInput } from "@/features/insumos/types";

type GestaoDeInsumosViewProps = {
  insumos: InsumoEmEstoque[];
  acessoriosIniciais: AcessorioEmEstoque[];
  bancoDisponivel: boolean;
};

/**
 * Insumos, lotes e movimentações vêm do banco (server component da página); entradas, baixas
 * e cadastros são server actions que revalidam a rota. Só os acessórios ainda são locais.
 */
export function GestaoDeInsumosView({ insumos, acessoriosIniciais, bancoDisponivel }: GestaoDeInsumosViewProps) {
  const { acessorios, adicionarAcessorio } = useAcessoriosMockStore(acessoriosIniciais);
  const kpis = useMemo(() => calcularKpis(insumos, acessorios), [insumos, acessorios]);

  async function registrarInsumo(insumo: InsumoInput) {
    const resultado = await cadastrarInsumoAction(insumo);
    if (!resultado.ok) throw new Error(resultado.erro);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-widest text-terracotta uppercase">
            Estoque de Fibras &amp; Aviamentos · Ciclo Outono / Inverno
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Almoxarifado &amp; Insumos Têxteis
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Rastreabilidade meticulosa de cones, novelos e acabamentos artesanais com cálculo
            milimétrico de custo por grama. Use (+) e (−) para lançar entradas e baixas; clique na linha
            para ver o histórico.
          </p>
        </div>
        <CadastrarInsumoDialog onRegistrar={registrarInsumo} />
      </header>

      {bancoDisponivel ? null : (
        <p role="alert" className="rounded-xl border border-ochre/50 bg-canvas p-4 text-sm text-ink">
          Banco de dados indisponível: não foi possível carregar os insumos. Suba o banco com{" "}
          <code className="font-mono">pnpm db:up</code>.
        </p>
      )}

      <InsumoKpiCards kpis={kpis} />
      <InventoryTable insumos={insumos} />
      <AcessoriosSection acessorios={acessorios} onAdicionar={adicionarAcessorio} />
      <FichaTecnicaSyncFooter insumos={insumos} acessorios={acessorios} />
    </div>
  );
}
