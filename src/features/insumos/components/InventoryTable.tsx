"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon, SearchIcon } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BaixaEstoqueDialog } from "@/features/insumos/components/BaixaEstoqueDialog";
import { EntradaEstoqueDialog } from "@/features/insumos/components/EntradaEstoqueDialog";
import { HistoricoRastreabilidadeDialog } from "@/features/insumos/components/HistoricoRastreabilidadeDialog";
import { useInventoryTable } from "@/features/insumos/hooks/use-inventory-table";
import {
  SUFIXO_CUSTO,
  calcularCustoUnitario,
  formatarCustoUnitario,
} from "@/features/insumos/services/insumo-custo";
import {
  capacidadeDeReferencia,
  statusDoEstoque,
  type FiltroDeInsumos,
} from "@/features/insumos/services/insumo-estoque";
import { ROTULO_CATEGORIA, type InsumoEmEstoque } from "@/features/insumos/types";

const FORMATO_MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ABAS: { valor: FiltroDeInsumos; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "fio", rotulo: ROTULO_CATEGORIA.fio },
  { valor: "aviamento", rotulo: ROTULO_CATEGORIA.aviamento },
  { valor: "alerta", rotulo: "Alerta Baixo" },
];

type DialogoAberto = { tipo: "entrada" | "baixa" | "historico"; insumoId: string };

export function InventoryTable({ insumos }: { insumos: InsumoEmEstoque[] }) {
  const [dialogo, setDialogo] = useState<DialogoAberto | null>(null);
  const insumoDoDialogo = dialogo ? insumos.find((i) => i.id === dialogo.insumoId) : undefined;
  const {
    busca,
    filtro,
    contagem,
    itensDaPagina,
    totalFiltrado,
    paginaAtual,
    totalPaginas,
    alterarBusca,
    alterarFiltro,
    irParaPagina,
  } = useInventoryTable(insumos);

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={busca}
            onChange={(e) => alterarBusca(e.target.value)}
            placeholder="Filtrar por nome, cor, fibra..."
            aria-label="Filtrar insumos"
            className="h-10 bg-canvas pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ABAS.map(({ valor, rotulo }) => (
            <Button
              key={valor}
              type="button"
              size="sm"
              variant={filtro === valor ? "default" : "outline"}
              onClick={() => alterarFiltro(valor)}
              className="rounded-full"
            >
              {rotulo} ({contagem[valor]})
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Insumo &amp; Marca</TableHead>
              <TableHead>Tipo / Lote</TableHead>
              <TableHead>Cor Visual</TableHead>
              <TableHead>Preço / Cone</TableHead>
              <TableHead>Rendimento</TableHead>
              <TableHead>Custo / Un.</TableHead>
              <TableHead>Nível em Estoque</TableHead>
              <TableHead className="text-right">Movimentar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itensDaPagina.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhum insumo encontrado para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              itensDaPagina.map((insumo) => (
                <LinhaDoInsumo
                  key={insumo.id}
                  insumo={insumo}
                  onAbrir={(tipo) => setDialogo({ tipo, insumoId: insumo.id })}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row">
        <span>
          Mostrando {itensDaPagina.length} de {totalFiltrado} matérias-primas cadastradas
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={paginaAtual <= 1}
            onClick={() => irParaPagina(paginaAtual - 1)}
          >
            Anterior
          </Button>
          <span aria-current="page">
            {paginaAtual} / {totalPaginas}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={paginaAtual >= totalPaginas}
            onClick={() => irParaPagina(paginaAtual + 1)}
          >
            Próximo
          </Button>
        </div>
      </div>
      {insumoDoDialogo && dialogo?.tipo === "entrada" ? (
        <EntradaEstoqueDialog insumo={insumoDoDialogo} onFechar={() => setDialogo(null)} />
      ) : null}
      {insumoDoDialogo && dialogo?.tipo === "baixa" ? (
        <BaixaEstoqueDialog insumo={insumoDoDialogo} onFechar={() => setDialogo(null)} />
      ) : null}
      {insumoDoDialogo && dialogo?.tipo === "historico" ? (
        <HistoricoRastreabilidadeDialog insumo={insumoDoDialogo} onFechar={() => setDialogo(null)} />
      ) : null}
    </section>
  );
}

function LinhaDoInsumo({
  insumo,
  onAbrir,
}: {
  insumo: InsumoEmEstoque;
  onAbrir: (tipo: DialogoAberto["tipo"]) => void;
}) {
  const custoBase = calcularCustoUnitario(insumo);
  const custo =
    insumo.custoPonderado && custoBase ? { valor: insumo.custoPonderado, unidade: custoBase.unidade } : custoBase;
  const status = statusDoEstoque(insumo.estoqueAtual, insumo.pontoPedido);
  const capacidade = capacidadeDeReferencia(insumo.pontoPedido);
  const pctNivel = Math.min(100, Math.round((insumo.estoqueAtual / capacidade) * 100));
  const corDaBarra = status === "ok" ? "bg-sage" : status === "baixo" ? "bg-ochre" : "bg-critical";

  return (
    <TableRow
      tabIndex={0}
      aria-label={`Ver histórico de ${insumo.nomeComercial}`}
      onClick={() => onAbrir("historico")}
      onKeyDown={(evento) => {
        if (evento.target === evento.currentTarget && (evento.key === "Enter" || evento.key === " ")) {
          evento.preventDefault();
          onAbrir("historico");
        }
      }}
      className="cursor-pointer"
    >
      <TableCell className="max-w-56 whitespace-normal">
        <div className="flex flex-col">
          <span className="font-medium text-ink">{insumo.nomeComercial}</span>
          <span className="text-xs text-muted-foreground">{insumo.marca}</span>
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="flex flex-col font-mono text-xs">
          <span>{ROTULO_CATEGORIA[insumo.categoria]}</span>
          <span className="text-muted-foreground">{insumo.lote}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3.5 shrink-0 rounded-full border border-border"
            style={{ backgroundColor: corAproximada(insumo.cor) }}
          />
          <span className="text-sm">{insumo.cor || "—"}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">
        {FORMATO_MOEDA.format(insumo.precoAquisicao)}
      </TableCell>
      <TableCell className="font-mono text-sm">
        {insumo.pesoGramas ? `${insumo.pesoGramas}g` : "—"}
        {insumo.rendimentoMetros ? (
          <span className="text-muted-foreground"> ({insumo.rendimentoMetros}m)</span>
        ) : null}
      </TableCell>
      <TableCell className="font-mono text-sm">
        {custo ? `R$ ${formatarCustoUnitario(custo.valor)}${SUFIXO_CUSTO[custo.unidade]}` : "—"}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-ink">
              {insumo.estoqueAtual}
              {insumo.unidade === "un" ? "" : insumo.unidade}
            </span>
            <StatusBadge status={status} />
          </div>
          <div
            role="progressbar"
            aria-valuenow={pctNivel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Nível de estoque de ${insumo.nomeComercial}`}
            className="h-1.5 w-24 overflow-hidden rounded-full bg-border"
          >
            <div className={`h-full ${corDaBarra}`} style={{ width: `${pctNivel}%` }} />
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            size="icon"
            variant="outline"
            title="Registrar entrada"
            onClick={(evento) => {
              evento.stopPropagation();
              onAbrir("entrada");
            }}
          >
            <PlusIcon aria-hidden="true" />
            <span className="sr-only">Registrar entrada de {insumo.nomeComercial}</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            title="Registrar baixa"
            onClick={(evento) => {
              evento.stopPropagation();
              onAbrir("baixa");
            }}
          >
            <MinusIcon aria-hidden="true" />
            <span className="sr-only">Registrar baixa de {insumo.nomeComercial}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * Aproximação só para a bolinha de prévia da cor: usa o nome cadastrado como pista
 * (sem depender do seletor livre de hex, proibido pelo design system). Cai para a
 * borda neutra quando não reconhece o nome.
 */
function corAproximada(nomeDaCor: string): string {
  const nome = nomeDaCor.toLowerCase();
  if (nome.includes("terracota") || nome.includes("argila")) return "#8c6a5d";
  if (nome.includes("verde") || nome.includes("musgo")) return "#a3b18a";
  if (nome.includes("cru") || nome.includes("natural") || nome.includes("branco")) return "#f2ede4";
  if (nome.includes("dourado") || nome.includes("amêndoa") || nome.includes("amendoa")) return "#d4a373";
  return "#e4e2dd";
}
