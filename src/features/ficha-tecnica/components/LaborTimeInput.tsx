"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { FormField, ariaDoCampo } from "@/components/FormField";
import type { FichaTecnicaFormValues } from "@/features/ficha-tecnica/types";

type LaborTimeInputProps = {
  valores: Pick<FichaTecnicaFormValues, "horas" | "minutos">;
  erro?: string;
  onAlterar: (campo: "horas" | "minutos", valor: string) => void;
};

export function LaborTimeInput({ valores, erro, onAlterar }: LaborTimeInputProps) {
  const base = useId();
  const id = (campo: string) => `${base}-${campo}`;

  return (
    <fieldset className="flex flex-col gap-1.5 rounded-xl bg-canvas p-4">
      <legend className="sr-only">Tempo estimado de confecção</legend>
      <span aria-hidden="true" className="text-xs font-semibold tracking-wider text-ink uppercase">
        Tempo estimado
      </span>
      <div className="flex items-end gap-2">
        <FormField id={id("horas")} label="Horas" className="flex-1">
          <Input
            id={id("horas")}
            inputMode="numeric"
            value={valores.horas}
            onChange={(evento) => onAlterar("horas", evento.target.value)}
            placeholder="0"
            className="h-11 bg-surface font-mono md:h-10"
            {...ariaDoCampo(id("horas"), erro)}
          />
        </FormField>
        <FormField id={id("minutos")} label="Minutos" className="flex-1">
          <Input
            id={id("minutos")}
            inputMode="numeric"
            value={valores.minutos}
            onChange={(evento) => onAlterar("minutos", evento.target.value)}
            placeholder="0"
            className="h-11 bg-surface font-mono md:h-10"
            {...ariaDoCampo(id("minutos"), erro)}
          />
        </FormField>
      </div>
    </fieldset>
  );
}
