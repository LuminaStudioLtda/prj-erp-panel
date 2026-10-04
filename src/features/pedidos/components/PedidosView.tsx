"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalculatorIcon, PlusCircleIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlterarStatusDialog } from "@/features/pedidos/components/AlterarStatusDialog";
import { CriarPedidoDialog } from "@/features/pedidos/components/CriarPedidoDialog";
import { PedidosKpiCards } from "@/features/pedidos/components/PedidosKpiCards";
import { StatusDoPedidoBadge } from "@/features/pedidos/components/StatusDoPedidoBadge";
import {
  calcularIndicadoresDePedidos,
  contarPorStatus,
  filtrarPedidos,
} from "@/features/pedidos/services/pedido-indicadores";
import { ORDEM_DOS_STATUS, proximaEtapa, ROTULO_DO_STATUS, transicoesPermitidas } from "@/features/pedidos/services/pedido-status";
import type { PedidoDaLista, ProdutoParaPedido, StatusDoPedido } from "@/features/pedidos/types";
import { formatarDataCurta, formatarMoeda } from "@/lib/formatar";

type PedidosViewProps = {
  pedidos: PedidoDaLista[];
  produtos: ProdutoParaPedido[];
  agora: Date;
  bancoDisponivel: boolean;
};

type MudancaDeStatus = { pedido: PedidoDaLista; para: StatusDoPedido; rotulo: string };

export function PedidosView({ pedidos, produtos, agora, bancoDisponivel }: PedidosViewProps) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<StatusDoPedido | "todos">("todos");
  const [criando, setCriando] = useState(false);
  const [mudanca, setMudanca] = useState<MudancaDeStatus | null>(null);

  const indicadores = useMemo(() => calcularIndicadoresDePedidos(pedidos, agora), [pedidos, agora]);
  const contagem = useMemo(() => contarPorStatus(pedidos), [pedidos]);
  const filtrados = useMemo(() => filtrarPedidos(pedidos, busca, filtro), [pedidos, busca, filtro]);

  const abas = [
    { valor: "todos" as const, rotulo: "Todos" },
    ...ORDEM_DOS_STATUS.filter((status) => (contagem[status] ?? 0) > 0).map((status) => ({
      valor: status,
      rotulo: ROTULO_DO_STATUS[status],
    })),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-widest text-terracotta uppercase">
            Fila de confecção &amp; entregas
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">Gestão de pedidos</h1>
          <p className="max-w-2xl text-muted-foreground">
            Cada pedido recebe um código único. Ao iniciar a confecção, o estoque de insumos é baixado
            automaticamente pelas fichas técnicas.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setCriando(true)}
          className="h-11 px-5 text-xs font-semibold tracking-wider uppercase md:h-10"
        >
          <PlusCircleIcon aria-hidden="true" />
          Criar novo pedido
        </Button>
      </header>

      {bancoDisponivel ? null : (
        <p role="alert" className="rounded-xl border border-ochre/50 bg-canvas p-4 text-sm text-ink">
          Banco de dados indisponível: não foi possível carregar os pedidos. Suba o banco com{" "}
          <code className="font-mono">pnpm db:up</code>.
        </p>
      )}

      <PedidosKpiCards indicadores={indicadores} />

      <section className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código, cliente ou peça..."
              aria-label="Buscar pedidos"
              className="h-10 bg-canvas pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {abas.map(({ valor, rotulo }) => (
              <Button
                key={valor}
                type="button"
                size="sm"
                variant={filtro === valor ? "default" : "outline"}
                onClick={() => setFiltro(valor)}
                className="rounded-full"
              >
                {rotulo} ({contagem[valor] ?? 0})
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nenhum pedido encontrado para este filtro.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((pedido) => {
                  const etapa = proximaEtapa(pedido.status);
                  const podeCancelar = transicoesPermitidas(pedido.status).includes("CANCELLED");

                  return (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-mono text-sm font-semibold text-ink">{pedido.codigo}</TableCell>
                      <TableCell className="max-w-56 whitespace-normal">
                        <div className="flex flex-col">
                          <span className="font-medium text-ink">{pedido.cliente}</span>
                          <span className="text-xs text-muted-foreground">
                            {pedido.itens.map((item) => `${item.quantidade}× ${item.nome}`).join(", ") || "Sem itens"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {formatarDataCurta(pedido.criadoEm)}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {pedido.entregaPrevista ? formatarDataCurta(pedido.entregaPrevista) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusDoPedidoBadge status={pedido.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatarMoeda(pedido.total)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/admin/precificacao?codigo=${encodeURIComponent(pedido.codigo)}`}
                            title="Ver precificação deste pedido"
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:bg-canvas"
                          >
                            <CalculatorIcon className="size-4" aria-hidden="true" />
                            <span className="sr-only">Ver precificação do pedido {pedido.codigo}</span>
                          </Link>
                          {etapa ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setMudanca({ pedido, para: etapa.para, rotulo: etapa.rotulo })}
                            >
                              {etapa.rotulo}
                            </Button>
                          ) : null}
                          {podeCancelar ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-critical"
                              onClick={() => setMudanca({ pedido, para: "CANCELLED", rotulo: "Cancelar pedido" })}
                            >
                              Cancelar
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <p className="border-t border-border pt-4 text-sm text-muted-foreground">
          Mostrando {filtrados.length} de {pedidos.length} pedidos
        </p>
      </section>

      {criando ? <CriarPedidoDialog produtos={produtos} onFechar={() => setCriando(false)} /> : null}
      {mudanca ? (
        <AlterarStatusDialog
          pedido={mudanca.pedido}
          para={mudanca.para}
          rotulo={mudanca.rotulo}
          onFechar={() => setMudanca(null)}
        />
      ) : null}
    </div>
  );
}
