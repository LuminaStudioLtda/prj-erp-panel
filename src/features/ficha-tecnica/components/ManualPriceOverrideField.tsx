"use client";

import { useId } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField, ariaDoCampo } from "@/components/FormField";
import { erroDoPrecoManual } from "@/features/ficha-tecnica/services/ficha-tecnica-form";
import {
  formatarMoeda,
  formatarPercentual,
  type ResultadoDePrecificacao,
} from "@/features/ficha-tecnica/services/precificacao";

type ManualPriceOverrideFieldProps = {
  valor: string;
  erro?: string;
  resultado: ResultadoDePrecificacao;
  /** Margem desejada em pontos percentuais inteiros (35 = 35%). */
  margemPct: number;
  onAlterar: (valor: string) => void;
};

export function ManualPriceOverrideField({
  valor,
  erro,
  resultado,
  margemPct,
  onAlterar,
}: ManualPriceOverrideFieldProps) {
  const id = useId();
  const erroPreco = erro ?? erroDoPrecoManual(valor);

  const manual = valor.trim() !== "" && !erroPreco;
  const prejuizo = resultado.precoFinal > 0 && resultado.lucro < 0;
  const abaixoDoSugerido = manual && resultado.precoFinal < resultado.precoSugerido && !prejuizo;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-terracotta/40 bg-canvas p-4">
      <FormField
        id={id}
        label="Preço final de venda (R$)"
        dica="Deixe vazio para usar o preço sugerido."
        erro={erroPreco}
      >
        <Input
          id={id}
          inputMode="decimal"
          value={valor}
          onChange={(evento) => onAlterar(evento.target.value)}
          placeholder={resultado.precoSugerido.toFixed(2).replace(".", ",")}
          className="h-12 bg-surface font-mono text-lg font-semibold"
          {...ariaDoCampo(id, erroPreco, "dica")}
        />
      </FormField>

      <p className="text-xs text-muted-foreground">
        Preço aplicado: <span className="font-mono font-semibold text-ink">{formatarMoeda(resultado.precoFinal)}</span>
        {" · "}margem real:{" "}
        <span className="font-mono font-semibold text-ink">
          {resultado.precoFinal > 0 ? formatarPercentual(resultado.margemReal) : "—"}
        </span>
      </p>

      {prejuizo ? (
        <p role="status" className="flex items-start gap-2 text-xs font-semibold text-critical">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Este preço não cobre o custo direto com perdas: a peça daria prejuízo.
        </p>
      ) : abaixoDoSugerido ? (
        <p role="status" className="flex items-start gap-2 text-xs text-ink">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-ochre" aria-hidden="true" />
          Preço abaixo do sugerido: a margem fica menor que os {margemPct}% desejados.
        </p>
      ) : null}
    </div>
  );
}
