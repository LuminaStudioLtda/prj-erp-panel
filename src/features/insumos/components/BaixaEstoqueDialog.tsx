"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/FormField";
import { registrarBaixaAction } from "@/features/insumos/actions/estoque-actions";
import { arredondarQuantidade } from "@/features/insumos/services/estoque-calculos";
import { parseNumeroPtBr } from "@/features/insumos/services/insumo-form";
import {
  MOTIVOS_DA_BAIXA,
  ROTULO_MOTIVO_DA_BAIXA,
  type MotivoDaBaixa,
} from "@/features/insumos/services/movimentacao";
import type { InsumoEmEstoque } from "@/features/insumos/types";

type BaixaEstoqueDialogProps = {
  insumo: InsumoEmEstoque;
  onFechar: () => void;
};

export function BaixaEstoqueDialog({ insumo, onFechar }: BaixaEstoqueDialogProps) {
  const base = useId();
  const id = (campo: string) => `${base}-${campo}`;
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState<MotivoDaBaixa>("perda");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const sufixo = insumo.unidade === "un" ? "un" : insumo.unidade;
  const valor = parseNumeroPtBr(quantidade);
  const valida = valor !== null && valor > 0;
  const excede = valida && valor > insumo.estoqueAtual;
  const saldoApos = valida && !excede ? arredondarQuantidade(insumo.estoqueAtual - valor) : null;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    if (!valida) return setErro("Informe uma quantidade maior que zero.");
    if (excede) return setErro("A baixa é maior que o saldo em estoque.");

    setEnviando(true);
    setErro(null);
    const resultado = await registrarBaixaAction({ materialId: insumo.id, quantidade, motivo, observacao });
    setEnviando(false);

    if (resultado.ok) onFechar();
    else setErro(resultado.erro);
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="bg-canvas sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Baixa manual de estoque</DialogTitle>
          <DialogDescription>
            {insumo.nomeComercial}. Saldo atual: {insumo.estoqueAtual.toLocaleString("pt-BR")}
            {sufixo}. A baixa consome primeiro os lotes mais antigos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <FormField id={id("qtd")} label={`Quantidade (${sufixo})`} obrigatorio>
            <Input
              id={id("qtd")}
              inputMode="decimal"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              aria-invalid={excede || undefined}
              className="h-11 bg-surface font-mono md:h-10"
            />
          </FormField>

          <FormField id={id("motivo")} label="Motivo" obrigatorio>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoDaBaixa)}>
              <SelectTrigger id={id("motivo")} className="h-11 w-full bg-surface md:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_DA_BAIXA.map((m) => (
                  <SelectItem key={m} value={m}>
                    {ROTULO_MOTIVO_DA_BAIXA[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id={id("obs")} label="Observação">
            <Input id={id("obs")} value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} className="h-11 bg-surface md:h-10" />
          </FormField>

          <p className="rounded-xl bg-surface p-3 text-sm text-muted-foreground">
            Saldo após a baixa:{" "}
            <span className="font-mono text-ink">{saldoApos === null ? "—" : `${saldoApos.toLocaleString("pt-BR")}${sufixo}`}</span>
            {excede ? <span className="ml-2 text-critical">maior que o saldo</span> : null}
          </p>

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
              {enviando ? "Registrando..." : "Registrar baixa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
