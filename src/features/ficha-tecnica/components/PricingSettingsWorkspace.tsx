"use client";

import { useState } from "react";
import { ClockIcon } from "lucide-react";
import { formatarDataHora } from "@/lib/formatar";
import { FormulasComExemplo } from "@/features/ficha-tecnica/components/FormulasComExemplo";
import { PricingSettingsForm } from "@/features/ficha-tecnica/components/PricingSettingsForm";
import { PricingSimulator } from "@/features/ficha-tecnica/components/PricingSimulator";
import { SecaoDaFicha } from "@/features/ficha-tecnica/components/SecaoDaFicha";
import {
  configuracaoParaFormulario,
  validarConfiguracao,
  type ConfiguracaoFormValues,
  type ConfiguracaoGlobal,
} from "@/features/ficha-tecnica/services/configuracao-de-precificacao";

type PricingSettingsWorkspaceProps = {
  salva: ConfiguracaoGlobal;
  /** `null` enquanto nada foi salvo e os valores padrão estão em uso. */
  atualizadoEm: Date | null;
  somenteLeitura: boolean;
};

export function PricingSettingsWorkspace({ salva, atualizadoEm, somenteLeitura }: PricingSettingsWorkspaceProps) {
  const [valores, setValores] = useState<ConfiguracaoFormValues>(() => configuracaoParaFormulario(salva));
  const rascunho = validarConfiguracao(valores).configuracao ?? null;

  const naoSalva =
    rascunho !== null &&
    JSON.stringify(configuracaoParaFormulario(rascunho)) !== JSON.stringify(configuracaoParaFormulario(salva));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start">
        <SecaoDaFicha
          titulo="Valores globais"
          descricao="Alterar estes valores não reescreve preços manuais já definidos nas peças."
          acao={
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-canvas px-2.5 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" aria-hidden="true" />
              {atualizadoEm ? `Atualizado em ${formatarDataHora(atualizadoEm)}` : "Ainda não configurado: usando padrão"}
            </span>
          }
        >
          <PricingSettingsForm
            valores={valores}
            onAlterar={(campo, valor) => setValores((atual) => ({ ...atual, [campo]: valor }))}
            somenteLeitura={somenteLeitura}
          />
        </SecaoDaFicha>

        <div className="xl:sticky xl:top-24">
          <PricingSimulator salva={salva} rascunho={rascunho} />
        </div>
      </div>

      <FormulasComExemplo configuracao={rascunho ?? salva} naoSalva={naoSalva} />
    </div>
  );
}
