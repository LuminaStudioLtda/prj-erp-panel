import Link from "next/link";
import { StatusBadge, type Status } from "@/components/StatusBadge";
import type { FioEmDestaque } from "@/features/dashboard/types";

const COR_DA_BARRA: Record<Status, string> = {
  ok: "bg-sage",
  baixo: "bg-ochre",
  critico: "bg-critical",
};

export function EstoqueDeFios({ fios }: { fios: FioEmDestaque[] }) {
  return (
    <section aria-label="Estoque de fios" className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-sm">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-lg font-semibold text-ink">Estoque de fios</h2>
        <p className="text-sm text-muted-foreground">Os que mais precisam de reposição.</p>
      </header>

      {fios.length === 0 ? (
        <p className="rounded-xl bg-canvas p-4 text-sm text-muted-foreground">Nenhum fio cadastrado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {fios.map((fio) => (
            <li key={fio.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-ink">{fio.nome}</span>
                  <span className="text-xs text-muted-foreground">{fio.cor}</span>
                </div>
                <StatusBadge status={fio.status} />
              </div>
              <div className="flex items-center gap-3">
                <div
                  role="img"
                  aria-label={`Nível de estoque: ${Math.round(fio.nivel * 100)}% da referência`}
                  className="h-2 flex-1 overflow-hidden rounded-full bg-border"
                >
                  <span
                    className={`block h-full rounded-full ${COR_DA_BARRA[fio.status]}`}
                    style={{ width: `${Math.max(4, fio.nivel * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-ink">
                  {fio.estoqueAtual}
                  {fio.unidade}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin/insumos"
        className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
      >
        Gerenciar estoque
      </Link>
    </section>
  );
}
