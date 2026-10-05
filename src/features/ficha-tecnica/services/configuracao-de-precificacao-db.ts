import "server-only";

import {
  CONFIGURACAO_GLOBAL_PADRAO,
  type ConfiguracaoGlobal,
} from "@/features/ficha-tecnica/services/configuracao-de-precificacao";
import type { AuthenticatedUser } from "@/features/rbac/types";
import { withDatabaseRole } from "@/lib/with-database-role";

const ID_DA_CONFIGURACAO = "default";

export type ConfiguracaoLida = {
  configuracao: ConfiguracaoGlobal;
  /** `null` enquanto nenhuma configuração foi salva e os valores padrão estão em uso. */
  atualizadoEm: Date | null;
  /** `false` quando o banco não respondeu e os valores padrão estão em uso. */
  bancoDisponivel: boolean;
};

export async function lerConfiguracaoDePrecificacao(
  ator: AuthenticatedUser | null,
): Promise<ConfiguracaoLida> {
  try {
    const registro = await withDatabaseRole(ator, (transacao) =>
      transacao.pricingSettings.findUnique({ where: { id: ID_DA_CONFIGURACAO } }),
    );
    if (!registro) {
      return { configuracao: CONFIGURACAO_GLOBAL_PADRAO, atualizadoEm: null, bancoDisponivel: true };
    }

    return {
      configuracao: {
        precificacao: {
          valorHoraTrabalhada: registro.hourlyRate.toNumber(),
          taxaPerdas: registro.lossRate.toNumber(),
        },
        margemPadraoPct: Math.round(registro.desiredMarginPercent.toNumber()),
      },
      atualizadoEm: registro.updatedAt,
      bancoDisponivel: true,
    };
  } catch {
    return { configuracao: CONFIGURACAO_GLOBAL_PADRAO, atualizadoEm: null, bancoDisponivel: false };
  }
}

export async function salvarConfiguracaoDePrecificacao(
  ator: AuthenticatedUser,
  configuracao: ConfiguracaoGlobal,
): Promise<void> {
  const dados = {
    hourlyRate: configuracao.precificacao.valorHoraTrabalhada,
    lossRate: configuracao.precificacao.taxaPerdas,
    desiredMarginPercent: configuracao.margemPadraoPct,
  };

  await withDatabaseRole(ator, (transacao) =>
    transacao.pricingSettings.upsert({
      where: { id: ID_DA_CONFIGURACAO },
      create: { id: ID_DA_CONFIGURACAO, ...dados },
      update: dados,
    }),
  );
}
