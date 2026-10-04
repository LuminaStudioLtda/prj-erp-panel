"use client";

import { useId, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { formatarCustoUnitario } from "@/features/insumos/services/insumo-custo";
import { parseNumeroPtBr } from "@/features/insumos/services/insumo-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManualPriceOverrideField } from "@/features/ficha-tecnica/components/ManualPriceOverrideField";
import { PricingBreakdown } from "@/features/ficha-tecnica/components/PricingBreakdown";
import { SecaoDaFicha } from "@/features/ficha-tecnica/components/SecaoDaFicha";
import type { ConfiguracaoGlobal } from "@/features/ficha-tecnica/services/configuracao-de-precificacao";
import { calcularPrecificacao } from "@/features/ficha-tecnica/services/precificacao";
import type { FichaPorCodigo } from "@/features/ficha-tecnica/types";
import { formatarMoeda, formatarPercentual } from "@/lib/formatar";

type PrecificacaoPorCodigoProps = {
  ficha: FichaPorCodigo;
  configuracao: ConfiguracaoGlobal;
};

function formatarTempo(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas}h${resto > 0 ? ` ${resto}min` : ""}` : `${resto}min`;
}

export function PrecificacaoPorCodigo({ ficha, configuracao }: PrecificacaoPorCodigoProps) {
  const idMargem = useId();
  const [margemPct, setMargemPct] = useState(configuracao.margemPadraoPct);
  const [precoManual, setPrecoManual] = useState("");

  const manual = parseNumeroPtBr(precoManual);
  const entrada = {
    custoInsumos: ficha.custoInsumos,
    tempoMinutos: ficha.tempoMinutos,
    embalagens: ficha.custosIndiretos,
    margem: margemPct / 100,
  };
  const resultado = calcularPrecificacao(
    { ...entrada, precoManual: manual !== null && manual > 0 ? manual : null },
    configuracao.precificacao,
  );
  const doPedido =
    ficha.valorDoPedido !== null
      ? calcularPrecificacao({ ...entrada, precoManual: ficha.valorDoPedido }, configuracao.precificacao)
      : null;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="flex flex-col gap-6">
        <SecaoDaFicha
          numero="02"
          titulo={`Ficha técnica · ${ficha.codigo}`}
          descricao={`${ficha.descricao}: ${ficha.produtos.map((p) => `${p.quantidade}× ${p.nome}`).join(", ")}.`}
        >
          {ficha.produtosSemFicha.length > 0 ? (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-canvas p-3 text-sm text-critical">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Sem ficha técnica cadastrada (fora do cálculo): {ficha.produtosSemFicha.join(", ")}.
            </p>
          ) : null}
          {ficha.insumosSemCusto.length > 0 ? (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-canvas p-3 text-sm text-ink">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-ochre" aria-hidden="true" />
              Insumos sem custo registrado (contam como R$ 0,00): {ficha.insumosSemCusto.join(", ")}.
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Insumo / aviamento</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="text-right">Custo unitário vigente</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ficha.itens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum insumo na ficha técnica.
                    </TableCell>
                  </TableRow>
                ) : (
                  ficha.itens.map((item) => (
                    <TableRow key={item.materialId}>
                      <TableCell className="font-medium text-ink">{item.nome}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.quantidade.toLocaleString("pt-BR")}
                        {item.unidade}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.custoUnitario === null ? "—" : `R$ ${formatarCustoUnitario(item.custoUnitario)}/${item.unidade}`}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatarMoeda(item.custo)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-canvas p-4">
              <dt className="text-xs font-semibold tracking-wider text-ink uppercase">Mão de obra</dt>
              <dd className="font-mono text-xl font-semibold text-ink">{formatarTempo(ficha.tempoMinutos)}</dd>
              <dd className="text-xs text-muted-foreground">{ficha.tempoMinutos} minutos no total</dd>
            </div>
            <div className="rounded-xl bg-canvas p-4">
              <dt className="text-xs font-semibold tracking-wider text-ink uppercase">Custos indiretos</dt>
              <dd className="font-mono text-xl font-semibold text-ink">{formatarMoeda(ficha.custosIndiretos)}</dd>
              <dd className="text-xs text-muted-foreground">Embalagem, tags e mimos</dd>
            </div>
            <div className="rounded-xl bg-canvas p-4">
              <dt className="text-xs font-semibold tracking-wider text-ink uppercase">Insumos</dt>
              <dd className="font-mono text-xl font-semibold text-terracotta">{formatarMoeda(ficha.custoInsumos)}</dd>
              <dd className="text-xs text-muted-foreground">Custos do estoque hoje</dd>
            </div>
          </dl>
        </SecaoDaFicha>
      </div>

      <SecaoDaFicha numero="03" titulo="Resultado" descricao="Fórmulas do BRD com a configuração global salva.">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <label htmlFor={idMargem} className="text-xs font-semibold tracking-wider text-ink uppercase">
              Margem de lucro
            </label>
            <span className="font-mono text-sm font-semibold text-terracotta">{margemPct}%</span>
          </div>
          <input
            id={idMargem}
            type="range"
            min={0}
            max={100}
            step={1}
            value={margemPct}
            onChange={(evento) => setMargemPct(Number(evento.target.value))}
            className="h-6 w-full cursor-pointer accent-terracotta"
          />
        </div>

        <PricingBreakdown resultado={resultado} configuracao={configuracao.precificacao} margemPct={margemPct} />

        <ManualPriceOverrideField
          valor={precoManual}
          resultado={resultado}
          margemPct={margemPct}
          onAlterar={setPrecoManual}
        />

        {doPedido && ficha.valorDoPedido !== null ? (
          <div className="flex flex-col gap-2 rounded-xl bg-canvas p-4 text-sm">
            <p className="text-muted-foreground">
              Valor cobrado no pedido: <span className="font-mono font-semibold text-ink">{formatarMoeda(ficha.valorDoPedido)}</span>
              {" · "}margem real:{" "}
              <span className="font-mono font-semibold text-ink">{formatarPercentual(doPedido.margemReal)}</span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() => setPrecoManual(ficha.valorDoPedido!.toFixed(2).replace(".", ","))}
            >
              Usar valor do pedido como preço final
            </Button>
          </div>
        ) : null}
      </SecaoDaFicha>
    </div>
  );
}
