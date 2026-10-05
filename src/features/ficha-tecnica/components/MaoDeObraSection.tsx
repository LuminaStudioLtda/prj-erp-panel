import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { LaborTimeInput } from "@/features/ficha-tecnica/components/LaborTimeInput";
import { SecaoDaFicha } from "@/features/ficha-tecnica/components/SecaoDaFicha";
import { formatarMoeda } from "@/features/ficha-tecnica/services/precificacao";
import type { FichaTecnicaFormValues } from "@/features/ficha-tecnica/types";

type MaoDeObraSectionProps = {
  valores: Pick<FichaTecnicaFormValues, "horas" | "minutos">;
  erro?: string;
  valorHora: number;
  custoMaoDeObra: number;
  onAlterar: (campo: "horas" | "minutos", valor: string) => void;
};

export function MaoDeObraSection({
  valores,
  erro,
  valorHora,
  custoMaoDeObra,
  onAlterar,
}: MaoDeObraSectionProps) {
  return (
    <SecaoDaFicha
      titulo="Mão de obra artesanal"
      descricao="Tempo de agulha por peça, valorizado pela hora técnica do ateliê."
      acao={
        <Link
          href="/admin/precificacao"
          className="inline-flex h-6 items-center gap-1.5 rounded-full bg-sage/20 px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-sage/30"
        >
          <SettingsIcon className="size-3.5" aria-hidden="true" />
          Ajustar valor da hora
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LaborTimeInput valores={valores} erro={erro} onAlterar={onAlterar} />

        <div className="flex flex-col justify-between gap-1 rounded-xl bg-canvas p-4">
          <span className="text-xs font-semibold tracking-wider text-ink uppercase">
            Valor da hora técnica
          </span>
          <span className="font-mono text-xl font-semibold text-ink">
            {formatarMoeda(valorHora)}
            <span className="text-sm font-normal text-muted-foreground"> /hora</span>
          </span>
          <span className="text-xs text-muted-foreground">Definido na configuração global.</span>
        </div>

        <div className="flex flex-col justify-between gap-1 rounded-xl bg-canvas p-4">
          <span className="text-xs font-semibold tracking-wider text-ink uppercase">
            Subtotal mão de obra
          </span>
          <span className="font-mono text-xl font-semibold text-terracotta">
            {formatarMoeda(custoMaoDeObra)}
          </span>
          <span className="text-xs text-muted-foreground">(minutos ÷ 60) × valor da hora.</span>
        </div>
      </div>

      {erro ? (
        <p role="alert" className="-mt-3 text-xs text-critical">
          {erro}
        </p>
      ) : null}
    </SecaoDaFicha>
  );
}
