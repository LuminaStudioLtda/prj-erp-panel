"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { alterarStatusAction } from "@/features/pedidos/actions/pedidos-actions";
import { disparaBaixaDeEstoque, ROTULO_DO_STATUS } from "@/features/pedidos/services/pedido-status";
import type { PedidoDaLista, StatusDoPedido } from "@/features/pedidos/types";

type AlterarStatusDialogProps = {
  pedido: PedidoDaLista;
  para: StatusDoPedido;
  rotulo: string;
  onFechar: () => void;
};

export function AlterarStatusDialog({ pedido, para, rotulo, onFechar }: AlterarStatusDialogProps) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const baixa = disparaBaixaDeEstoque(pedido.status, para);
  const cancelaDepoisDaBaixa = para === "CANCELLED" && pedido.status === "IN_PRODUCTION";

  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    const resultado = await alterarStatusAction(pedido.id, para);
    setEnviando(false);

    if (resultado.ok) onFechar();
    else setErro(resultado.erro);
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && !enviando && onFechar()}>
      <DialogContent className="bg-canvas sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rotulo}</DialogTitle>
          <DialogDescription>
            Pedido <span className="font-mono">{pedido.codigo}</span> · {pedido.cliente}. Status atual:{" "}
            {ROTULO_DO_STATUS[pedido.status]}; novo status: {ROTULO_DO_STATUS[para]}.
          </DialogDescription>
        </DialogHeader>

        {baixa ? (
          <p className="rounded-xl bg-surface p-3 text-sm text-ink">
            Ao iniciar a confecção, o sistema dá baixa automática no estoque de todos os insumos das fichas técnicas
            dos produtos do pedido (quantidade da ficha × quantidade pedida), usando os lotes mais antigos primeiro.
            Se faltar material ou ficha técnica, nada é alterado.
          </p>
        ) : null}
        {cancelaDepoisDaBaixa ? (
          <p className="rounded-xl bg-surface p-3 text-sm text-ink">
            Os materiais já baixados <strong>não voltam</strong> ao estoque automaticamente. Se algum sobrou, registre
            uma entrada manual na Gestão de Insumos.
          </p>
        ) : null}

        {erro ? (
          <p role="alert" className="text-sm text-critical">
            {erro}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onFechar} disabled={enviando}>
            Voltar
          </Button>
          <Button type="button" variant={para === "CANCELLED" ? "destructive" : "default"} onClick={confirmar} disabled={enviando}>
            {enviando ? "Processando..." : rotulo}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
