"use client";

import { useActionState, useId } from "react";
import { CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, ariaDoCampo } from "@/components/FormField";
import {
  salvarConfiguracaoAction,
  type SalvarConfiguracaoState,
} from "@/features/ficha-tecnica/actions/configuracao-de-precificacao-actions";
import type { ConfiguracaoFormValues } from "@/features/ficha-tecnica/services/configuracao-de-precificacao";

type PricingSettingsFormProps = {
  valores: ConfiguracaoFormValues;
  onAlterar: (campo: keyof ConfiguracaoFormValues, valor: string) => void;
  somenteLeitura?: boolean;
};

export function PricingSettingsForm({ valores, onAlterar, somenteLeitura = false }: PricingSettingsFormProps) {
  const base = useId();
  const id = (campo: string) => `${base}-${campo}`;
  const [estado, acao, pendente] = useActionState<SalvarConfiguracaoState, FormData>(salvarConfiguracaoAction, {});
  const erros = estado.erros ?? {};

  return (
    <form action={acao} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          id={id("valorHora")}
          label="Valor da hora trabalhada (R$)"
          dica="Multiplica as horas de confecção de cada peça."
          erro={erros.valorHora}
          obrigatorio
        >
          <Input
            id={id("valorHora")}
            name="valorHora"
            inputMode="decimal"
            value={valores.valorHora}
            onChange={(evento) => onAlterar("valorHora", evento.target.value)}
            disabled={somenteLeitura}
            className="h-11 bg-canvas font-mono md:h-10"
            {...ariaDoCampo(id("valorHora"), erros.valorHora, "dica")}
          />
        </FormField>
        <FormField
          id={id("taxaPerdasPct")}
          label="Taxa de perdas (%)"
          dica="Aplicada sobre o custo direto: aparas, erros e sobras de fio."
          erro={erros.taxaPerdasPct}
          obrigatorio
        >
          <Input
            id={id("taxaPerdasPct")}
            name="taxaPerdasPct"
            inputMode="decimal"
            value={valores.taxaPerdasPct}
            onChange={(evento) => onAlterar("taxaPerdasPct", evento.target.value)}
            disabled={somenteLeitura}
            className="h-11 bg-canvas font-mono md:h-10"
            {...ariaDoCampo(id("taxaPerdasPct"), erros.taxaPerdasPct, "dica")}
          />
        </FormField>
        <FormField
          id={id("margemPadraoPct")}
          label="Margem padrão (%)"
          dica="Margem inicial de cada nova ficha técnica; pode ser ajustada por peça."
          erro={erros.margemPadraoPct}
          obrigatorio
          className="sm:col-span-2"
        >
          <Input
            id={id("margemPadraoPct")}
            name="margemPadraoPct"
            inputMode="numeric"
            value={valores.margemPadraoPct}
            onChange={(evento) => onAlterar("margemPadraoPct", evento.target.value)}
            disabled={somenteLeitura}
            className="h-11 bg-canvas font-mono sm:max-w-48 md:h-10"
            {...ariaDoCampo(id("margemPadraoPct"), erros.margemPadraoPct, "dica")}
          />
        </FormField>
      </div>

      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-critical">
          {estado.erroGeral}
        </p>
      ) : null}
      {estado.salvo ? (
        <p role="status" className="flex items-center gap-2 text-sm text-sage-foreground">
          <CheckCircle2Icon className="size-4" aria-hidden="true" />
          Configuração salva. As próximas simulações já usam estes valores.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pendente || somenteLeitura}>
          {pendente ? "Salvando..." : "Salvar configuração"}
        </Button>
      </div>
    </form>
  );
}
