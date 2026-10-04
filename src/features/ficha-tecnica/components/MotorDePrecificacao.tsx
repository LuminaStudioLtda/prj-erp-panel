"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { FormField, ariaDoCampo } from "@/components/FormField";
import { erroDasEmbalagens } from "@/features/ficha-tecnica/services/ficha-tecnica-form";
import { ManualPriceOverrideField } from "@/features/ficha-tecnica/components/ManualPriceOverrideField";
import { PricingBreakdown } from "@/features/ficha-tecnica/components/PricingBreakdown";
import { RentabilidadeDonut } from "@/features/ficha-tecnica/components/RentabilidadeDonut";
import { SecaoDaFicha } from "@/features/ficha-tecnica/components/SecaoDaFicha";
import {
  formatarMoeda,
  type ConfiguracaoDePrecificacao,
  type ResultadoDePrecificacao,
} from "@/features/ficha-tecnica/services/precificacao";
import type { FichaTecnicaFormErrors, FichaTecnicaFormValues } from "@/features/ficha-tecnica/types";

type MotorDePrecificacaoProps = {
  valores: Pick<FichaTecnicaFormValues, "margemPct" | "embalagens" | "precoManual">;
  erros: FichaTecnicaFormErrors;
  resultado: ResultadoDePrecificacao;
  configuracao: ConfiguracaoDePrecificacao;
  onAlterar: <K extends "margemPct" | "embalagens" | "precoManual">(
    campo: K,
    valor: FichaTecnicaFormValues[K],
  ) => void;
};

export function MotorDePrecificacao({
  valores,
  erros,
  resultado,
  configuracao,
  onAlterar,
}: MotorDePrecificacaoProps) {
  const base = useId();
  const erroEmbalagens = erros.embalagens ?? erroDasEmbalagens(valores.embalagens);
  const id = (campo: string) => `${base}-${campo}`;

  return (
    <SecaoDaFicha
      numero="03"
      titulo="Motor de precificação"
      descricao="Rentabilidade calculada pelas fórmulas do ateliê."
    >
      <FormField
        id={id("embalagens")}
        label="Embalagens, tags & mimos (R$)"
        dica="Custo indireto somado ao custo direto da peça."
        erro={erroEmbalagens}
      >
        <Input
          id={id("embalagens")}
          inputMode="decimal"
          value={valores.embalagens}
          onChange={(evento) => onAlterar("embalagens", evento.target.value)}
          placeholder="0,00"
          className="h-11 bg-canvas font-mono md:h-10"
          {...ariaDoCampo(id("embalagens"), erroEmbalagens, "dica")}
        />
      </FormField>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <label htmlFor={id("margem")} className="text-xs font-semibold tracking-wider text-ink uppercase">
            Margem de lucro desejada
          </label>
          <span className="font-mono text-sm font-semibold text-terracotta">{valores.margemPct}%</span>
        </div>
        <input
          id={id("margem")}
          type="range"
          min={0}
          max={100}
          step={1}
          value={valores.margemPct}
          onChange={(evento) => onAlterar("margemPct", Number(evento.target.value))}
          className="h-6 w-full cursor-pointer accent-terracotta"
        />
        <p className="text-xs text-muted-foreground">
          Lucro previsto sobre o preço sugerido:{" "}
          <span className="font-mono text-ink">{formatarMoeda(resultado.lucroSugerido)}</span>
        </p>
      </div>

      <PricingBreakdown resultado={resultado} configuracao={configuracao} margemPct={valores.margemPct} />

      <ManualPriceOverrideField
        valor={valores.precoManual}
        erro={erros.precoManual}
        resultado={resultado}
        margemPct={valores.margemPct}
        onAlterar={(valor) => onAlterar("precoManual", valor)}
      />

      <RentabilidadeDonut resultado={resultado} />
    </SecaoDaFicha>
  );
}
