"use client";

import { useEffect, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, SlidersHorizontalIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buscarHistoricoAction } from "@/features/insumos/actions/estoque-actions";
import { formatarCustoUnitario } from "@/features/insumos/services/insumo-custo";
import {
  ROTULO_MOVIMENTACAO,
  type InsumoEmEstoque,
  type MovimentacaoDeEstoque,
  type TipoDeMovimentacao,
} from "@/features/insumos/types";
import { formatarDataHora } from "@/lib/formatar";

type HistoricoRastreabilidadeDialogProps = {
  insumo: InsumoEmEstoque;
  onFechar: () => void;
};

type Carga = { estado: "carregando" } | { estado: "erro"; mensagem: string } | { estado: "pronto"; itens: MovimentacaoDeEstoque[] };

const COR_DO_TIPO: Record<TipoDeMovimentacao, string> = {
  ENTRADA: "bg-sage/20 text-sage-foreground",
  SAIDA_PRODUCAO: "bg-terracotta/15 text-terracotta",
  SAIDA_PERDA: "bg-critical/10 text-critical",
  AJUSTE: "bg-ochre/20 text-ochre-foreground",
};

function IconeDoTipo({ tipo }: { tipo: TipoDeMovimentacao }) {
  const propriedades = { className: "size-4", "aria-hidden": true } as const;
  if (tipo === "ENTRADA") return <ArrowUpIcon {...propriedades} />;
  if (tipo === "AJUSTE") return <SlidersHorizontalIcon {...propriedades} />;
  return <ArrowDownIcon {...propriedades} />;
}

export function HistoricoRastreabilidadeDialog({ insumo, onFechar }: HistoricoRastreabilidadeDialogProps) {
  const [carga, setCarga] = useState<Carga>({ estado: "carregando" });
  const sufixo = insumo.unidade === "un" ? "un" : insumo.unidade;

  useEffect(() => {
    let cancelado = false;
    buscarHistoricoAction(insumo.id).then((resultado) => {
      if (cancelado) return;
      setCarga(resultado.ok ? { estado: "pronto", itens: resultado.dados } : { estado: "erro", mensagem: resultado.erro });
    });
    return () => {
      cancelado = true;
    };
  }, [insumo.id]);

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl bg-canvas">
        <DialogHeader>
          <DialogTitle>Histórico de rastreabilidade</DialogTitle>
          <DialogDescription>
            {insumo.nomeComercial} · {insumo.sku || "sem SKU"} · saldo atual {insumo.estoqueAtual.toLocaleString("pt-BR")}
            {sufixo}
          </DialogDescription>
        </DialogHeader>

        {insumo.lotes && insumo.lotes.length > 0 ? (
          <section aria-label="Lotes em estoque" className="rounded-xl bg-surface p-4">
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Lotes em estoque</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {insumo.lotes.map((lote, indice) => (
                <li key={`${lote.referencia}-${indice}`} className="flex justify-between gap-3 font-mono text-xs">
                  <span className="text-ink">{lote.referencia}</span>
                  <span className="text-muted-foreground">
                    {lote.quantidade.toLocaleString("pt-BR")}
                    {sufixo} · R$ {formatarCustoUnitario(lote.custoUnitario)}/{sufixo}
                  </span>
                </li>
              ))}
            </ul>
            {insumo.custoPonderado ? (
              <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                Custo médio ponderado:{" "}
                <span className="font-mono font-semibold text-ink">
                  R$ {formatarCustoUnitario(insumo.custoPonderado)}/{sufixo}
                </span>
              </p>
            ) : null}
          </section>
        ) : null}

        {carga.estado === "carregando" ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Carregando histórico...</p>
        ) : carga.estado === "erro" ? (
          <p role="alert" className="py-6 text-center text-sm text-critical">
            {carga.mensagem}
          </p>
        ) : carga.itens.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {carga.itens.map((item) => (
              <li key={item.id} className="flex gap-3 rounded-xl bg-surface p-3">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${COR_DO_TIPO[item.tipo]}`}>
                  <IconeDoTipo tipo={item.tipo} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {ROTULO_MOVIMENTACAO[item.tipo]}
                      {item.codigoPedido ? <span className="font-mono font-normal text-muted-foreground"> · {item.codigoPedido}</span> : null}
                    </span>
                    <span className={`font-mono text-sm font-semibold ${item.quantidade >= 0 ? "text-sage-foreground" : "text-critical"}`}>
                      {item.quantidade >= 0 ? "+" : "−"}
                      {Math.abs(item.quantidade).toLocaleString("pt-BR")}
                      {sufixo}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatarDataHora(item.data)} · saldo {item.saldoApos.toLocaleString("pt-BR")}
                    {sufixo}
                    {item.lote ? ` · ${item.lote}` : ""}
                  </span>
                  {item.observacao ? <span className="text-xs text-ink">{item.observacao}</span> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
