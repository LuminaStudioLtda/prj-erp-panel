import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecaoDaFicha } from "@/features/ficha-tecnica/components/SecaoDaFicha";
import type { SugestaoDeCodigo } from "@/features/ficha-tecnica/services/ficha-por-codigo-db";

type BuscaDeFichaFormProps = {
  codigoAtual: string;
  sugestoes: SugestaoDeCodigo[];
  erro: string | null;
};

/** Formulário GET: a consulta vira `?codigo=` na URL, então o resultado pode ser compartilhado e recarregado. */
export function BuscaDeFichaForm({ codigoAtual, sugestoes, erro }: BuscaDeFichaFormProps) {
  return (
    <SecaoDaFicha
      numero="01"
      titulo="Puxar ficha técnica do pedido ou produto"
      descricao="Digite ou escolha o código para carregar insumos, quantidades, custos vigentes do estoque e mão de obra."
    >
      <form action="/admin/precificacao" method="get" className="flex flex-col gap-3 sm:flex-row" role="search">
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="codigo"
            list="sugestoes-de-codigo"
            defaultValue={codigoAtual}
            placeholder="#LUM-2026-0001 ou LUM-P-0001"
            aria-label="Código do pedido ou do produto"
            aria-invalid={erro ? true : undefined}
            autoComplete="off"
            className="h-11 bg-canvas pl-9 font-mono md:h-10"
          />
          <datalist id="sugestoes-de-codigo">
            {sugestoes.map((sugestao) => (
              <option key={sugestao.codigo} value={sugestao.codigo}>
                {sugestao.descricao}
              </option>
            ))}
          </datalist>
        </div>
        <Button type="submit" className="h-11 md:h-10">
          Puxar ficha técnica
        </Button>
      </form>
      {erro ? (
        <p role="alert" className="-mt-2 text-sm text-critical">
          {erro}
        </p>
      ) : null}
    </SecaoDaFicha>
  );
}
