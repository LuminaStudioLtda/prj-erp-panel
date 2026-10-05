"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField, ariaDoCampo } from "@/components/FormField";
import { registrarEntradaAction } from "@/features/insumos/actions/estoque-actions";
import { calcularEntrada, custoMedioPonderado } from "@/features/insumos/services/estoque-calculos";
import { formatarCustoUnitario } from "@/features/insumos/services/insumo-custo";
import { parseNumeroPtBr } from "@/features/insumos/services/insumo-form";
import type { InsumoEmEstoque } from "@/features/insumos/types";
import { formatarMoeda } from "@/lib/formatar";

type EntradaEstoqueDialogProps = {
  insumo: InsumoEmEstoque;
  onFechar: () => void;
};

function rendimentoPadrao(insumo: InsumoEmEstoque): string {
  const valor = insumo.unidade === "g" ? insumo.pesoGramas : insumo.unidade === "m" ? insumo.rendimentoMetros : 1;
  return valor ? String(valor).replace(".", ",") : "";
}

export function EntradaEstoqueDialog({ insumo, onFechar }: EntradaEstoqueDialogProps) {
  const base = useId();
  const id = (campo: string) => `${base}-${campo}`;
  const [cones, setCones] = useState("1");
  const [precoCone, setPrecoCone] = useState(insumo.precoAquisicao ? String(insumo.precoAquisicao).replace(".", ",") : "");
  const [rendimento, setRendimento] = useState(rendimentoPadrao(insumo));
  const [lote, setLote] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const sufixo = insumo.unidade === "un" ? "un" : insumo.unidade;
  const calculada = calcularEntrada({
    cones: parseNumeroPtBr(cones) ?? 0,
    precoCone: parseNumeroPtBr(precoCone) ?? 0,
    rendimento: parseNumeroPtBr(rendimento) ?? 0,
  });

  const lotesAtuais = (insumo.lotes ?? []).map((lote, indice) => ({
    id: `atual-${indice}`,
    quantidade: lote.quantidade,
    custoUnitario: lote.custoUnitario,
    recebidoEm: new Date(0),
  }));
  const novoCustoMedio = calculada
    ? custoMedioPonderado([
        ...lotesAtuais,
        { id: "novo", quantidade: calculada.quantidade, custoUnitario: calculada.custoUnitario, recebidoEm: new Date() },
      ])
    : null;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    if (!calculada) {
      setErro("Informe cones, preço e rendimento maiores que zero.");
      return;
    }

    setEnviando(true);
    setErro(null);
    const resultado = await registrarEntradaAction({ materialId: insumo.id, cones, precoCone, rendimento, lote, observacao });
    setEnviando(false);

    if (resultado.ok) onFechar();
    else setErro(resultado.erro);
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg bg-canvas">
        <DialogHeader>
          <DialogTitle>Entrada de estoque</DialogTitle>
          <DialogDescription>
            {insumo.nomeComercial} · {insumo.cor || "sem cor"}. O custo unitário vigente passa a ser a média ponderada de todos os lotes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField id={id("cones")} label="Cones / pacotes" obrigatorio>
              <Input id={id("cones")} inputMode="decimal" value={cones} onChange={(e) => setCones(e.target.value)} className="h-11 bg-surface font-mono md:h-10" {...ariaDoCampo(id("cones"))} />
            </FormField>
            <FormField id={id("preco")} label="Preço / cone (R$)" obrigatorio>
              <Input id={id("preco")} inputMode="decimal" value={precoCone} onChange={(e) => setPrecoCone(e.target.value)} className="h-11 bg-surface font-mono md:h-10" />
            </FormField>
            <FormField id={id("rendimento")} label={`Rendimento (${sufixo})`} obrigatorio>
              <Input id={id("rendimento")} inputMode="decimal" value={rendimento} onChange={(e) => setRendimento(e.target.value)} className="h-11 bg-surface font-mono md:h-10" />
            </FormField>
          </div>

          <FormField id={id("lote")} label="Lote de tintura" dica="Referência impressa na etiqueta do cone.">
            <Input id={id("lote")} value={lote} onChange={(e) => setLote(e.target.value)} maxLength={120} placeholder="Lot #0000-A" className="h-11 bg-surface md:h-10" />
          </FormField>
          <FormField id={id("obs")} label="Observação">
            <Input id={id("obs")} value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} className="h-11 bg-surface md:h-10" />
          </FormField>

          <dl className="grid grid-cols-1 gap-2 rounded-xl bg-surface p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Entra no estoque</dt>
              <dd className="font-mono text-ink">{calculada ? `${calculada.quantidade.toLocaleString("pt-BR")}${sufixo}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Custo deste lote</dt>
              <dd className="font-mono text-ink">{calculada ? `R$ ${formatarCustoUnitario(calculada.custoUnitario)}/${sufixo}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Novo custo médio</dt>
              <dd className="font-mono font-semibold text-terracotta">
                {novoCustoMedio !== null ? `R$ ${formatarCustoUnitario(novoCustoMedio)}/${sufixo}` : "—"}
              </dd>
            </div>
          </dl>
          {calculada ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              Total da compra: {formatarMoeda((parseNumeroPtBr(cones) ?? 0) * (parseNumeroPtBr(precoCone) ?? 0))}
            </p>
          ) : null}

          {erro ? (
            <p role="alert" className="text-sm text-critical">
              {erro}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onFechar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Registrando..." : "Registrar entrada"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
