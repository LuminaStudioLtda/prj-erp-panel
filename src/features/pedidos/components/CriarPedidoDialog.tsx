"use client";

import { useId, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, ariaDoCampo } from "@/components/FormField";
import { criarPedidoAction } from "@/features/pedidos/actions/pedidos-actions";
import {
  calcularTotalDoPedido,
  sugerirEntrega,
  VALORES_INICIAIS_DO_PEDIDO,
} from "@/features/pedidos/services/novo-pedido";
import type { NovoPedidoFormErrors, NovoPedidoFormValues, ProdutoParaPedido } from "@/features/pedidos/types";
import { formatarMoeda } from "@/lib/formatar";

type CriarPedidoDialogProps = {
  produtos: ProdutoParaPedido[];
  onFechar: () => void;
};

export function CriarPedidoDialog({ produtos, onFechar }: CriarPedidoDialogProps) {
  const base = useId();
  const id = (campo: string) => `${base}-${campo}`;
  const [valores, setValores] = useState<NovoPedidoFormValues>(VALORES_INICIAIS_DO_PEDIDO);
  const [entregaManual, setEntregaManual] = useState(false);
  const [erros, setErros] = useState<NovoPedidoFormErrors>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const total = calcularTotalDoPedido(valores.linhas, produtos);

  function alterar(proximo: NovoPedidoFormValues) {
    const entregaPrevista = entregaManual
      ? proximo.entregaPrevista
      : sugerirEntrega(proximo.linhas, produtos, new Date());
    setValores({ ...proximo, entregaPrevista });
  }

  function adicionarLinha() {
    const usados = new Set(valores.linhas.map((linha) => linha.produtoId));
    const proximo = produtos.find((produto) => !usados.has(produto.id)) ?? produtos[0];
    if (!proximo) return;
    alterar({ ...valores, linhas: [...valores.linhas, { produtoId: proximo.id, quantidade: "1" }] });
  }

  function alterarLinha(indice: number, parcial: Partial<NovoPedidoFormValues["linhas"][number]>) {
    alterar({
      ...valores,
      linhas: valores.linhas.map((linha, i) => (i === indice ? { ...linha, ...parcial } : linha)),
    });
  }

  function removerLinha(indice: number) {
    alterar({ ...valores, linhas: valores.linhas.filter((_, i) => i !== indice) });
  }

  async function enviar(status: "DRAFT" | "AWAITING_PRODUCTION") {
    if (enviando) return;
    setEnviando(true);
    setErros({});
    setErroGeral(null);
    const resultado = await criarPedidoAction(valores, status);
    setEnviando(false);

    if (resultado.ok) return onFechar();
    setErros(resultado.erros ?? {});
    setErroGeral(resultado.erros ? null : resultado.erro);
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && !enviando && onFechar()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl bg-canvas">
        <DialogHeader>
          <DialogTitle>Criar novo pedido</DialogTitle>
          <DialogDescription>
            O código <span className="font-mono">#LUM-AAAA-XXXX</span> é gerado automaticamente ao salvar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(evento) => evento.preventDefault()} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField id={id("cliente")} label="Cliente" erro={erros.cliente} obrigatorio>
              <Input
                id={id("cliente")}
                value={valores.cliente}
                onChange={(e) => alterar({ ...valores, cliente: e.target.value })}
                maxLength={160}
                className="h-11 bg-surface md:h-10"
                {...ariaDoCampo(id("cliente"), erros.cliente)}
              />
            </FormField>
            <FormField id={id("contato")} label="Contato" dica="E-mail ou telefone." erro={erros.contato}>
              <Input
                id={id("contato")}
                value={valores.contato}
                onChange={(e) => alterar({ ...valores, contato: e.target.value })}
                maxLength={80}
                className="h-11 bg-surface md:h-10"
                {...ariaDoCampo(id("contato"), erros.contato, "dica")}
              />
            </FormField>
          </div>

          <section aria-label="Produtos do pedido" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold tracking-wider text-ink uppercase">Produtos</h3>
              <Button type="button" size="sm" variant="outline" onClick={adicionarLinha} disabled={produtos.length === 0}>
                <PlusIcon aria-hidden="true" />
                Adicionar produto
              </Button>
            </div>

            {produtos.length === 0 ? (
              <p className="rounded-xl bg-surface p-3 text-sm text-muted-foreground">
                Nenhum produto cadastrado no catálogo.
              </p>
            ) : valores.linhas.length === 0 ? (
              <p className="rounded-xl bg-surface p-3 text-sm text-muted-foreground">Nenhum produto adicionado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {valores.linhas.map((linha, indice) => (
                  <li key={indice} className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-center gap-2">
                    <Select value={linha.produtoId} onValueChange={(produtoId) => alterarLinha(indice, { produtoId })}>
                      <SelectTrigger aria-label={`Produto ${indice + 1}`} className="h-11 w-full bg-surface md:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} · {formatarMoeda(produto.preco)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      aria-label={`Quantidade do produto ${indice + 1}`}
                      inputMode="numeric"
                      value={linha.quantidade}
                      onChange={(e) => alterarLinha(indice, { quantidade: e.target.value })}
                      className="h-11 bg-surface text-center font-mono md:h-10"
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removerLinha(indice)}>
                      <Trash2Icon aria-hidden="true" />
                      <span className="sr-only">Remover produto {indice + 1}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {erros.linhas ? (
              <p role="alert" className="text-xs text-critical">
                {erros.linhas}
              </p>
            ) : null}
          </section>

          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
            <FormField
              id={id("entrega")}
              label="Entrega prevista"
              dica="Sugerida pelo maior prazo de confecção dos produtos."
              erro={erros.entregaPrevista}
            >
              <Input
                id={id("entrega")}
                type="date"
                value={valores.entregaPrevista}
                onChange={(e) => {
                  setEntregaManual(true);
                  setValores({ ...valores, entregaPrevista: e.target.value });
                }}
                className="h-11 bg-surface md:h-10"
                {...ariaDoCampo(id("entrega"), erros.entregaPrevista, "dica")}
              />
            </FormField>
            <p className="text-right text-sm text-muted-foreground">
              Valor total: <span className="font-mono text-lg font-semibold text-terracotta">{formatarMoeda(total)}</span>
            </p>
          </div>

          {erroGeral ? (
            <p role="alert" className="text-sm text-critical">
              {erroGeral}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onFechar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={() => enviar("DRAFT")} disabled={enviando}>
              Salvar rascunho
            </Button>
            <Button type="button" onClick={() => enviar("AWAITING_PRODUCTION")} disabled={enviando}>
              {enviando ? "Salvando..." : "Criar pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
