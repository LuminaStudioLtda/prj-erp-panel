import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataCurta } from "@/lib/formatar";
import type { LinhaDaFila } from "@/features/dashboard/types";

type FilaDeConfeccaoProps = {
  fila: LinhaDaFila[];
  bancoDisponivel: boolean;
};

export function FilaDeConfeccao({ fila, bancoDisponivel }: FilaDeConfeccaoProps) {
  return (
    <section aria-label="Fila de confecção ativa" className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-sm">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-lg font-semibold text-ink">Fila de confecção ativa</h2>
        <p className="text-sm text-muted-foreground">Acompanhamento das peças na agulha e prontas para entrega.</p>
      </header>

      {!bancoDisponivel ? (
        <p role="alert" className="rounded-xl bg-canvas p-4 text-sm text-ink">
          Banco de dados indisponível: não foi possível carregar os pedidos. Suba o banco com{" "}
          <code className="font-mono">pnpm db:up</code>.
        </p>
      ) : fila.length === 0 ? (
        <p className="rounded-xl bg-canvas p-4 text-sm text-muted-foreground">
          Nenhum pedido em confecção no momento.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peça</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fila.map((linha) => (
              <TableRow key={linha.id}>
                <TableCell className="font-medium text-ink">{linha.peca}</TableCell>
                <TableCell className="text-muted-foreground">{linha.cliente}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{formatarDataCurta(linha.criadoEm)}</TableCell>
                <TableCell>
                  {linha.status === "IN_PRODUCTION" ? (
                    <StatusBadge status="baixo" rotulo="Em produção" />
                  ) : (
                    <StatusBadge status="ok" rotulo="Pronto p/ envio" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
