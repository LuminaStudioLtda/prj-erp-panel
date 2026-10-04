"use server";

import { revalidatePath } from "next/cache";
import {
  validarConfiguracao,
  type ConfiguracaoFormErrors,
  type ConfiguracaoFormValues,
} from "@/features/ficha-tecnica/services/configuracao-de-precificacao";
import { salvarConfiguracaoDePrecificacao } from "@/features/ficha-tecnica/services/configuracao-de-precificacao-db";
import { hasPermission } from "@/features/rbac/services/access-control";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type SalvarConfiguracaoState = {
  erros?: ConfiguracaoFormErrors;
  erroGeral?: string;
  salvo?: boolean;
};

export async function salvarConfiguracaoAction(
  _anterior: SalvarConfiguracaoState,
  formData: FormData,
): Promise<SalvarConfiguracaoState> {
  const valores: ConfiguracaoFormValues = {
    valorHora: String(formData.get("valorHora") ?? ""),
    taxaPerdasPct: String(formData.get("taxaPerdasPct") ?? ""),
    margemPadraoPct: String(formData.get("margemPadraoPct") ?? ""),
  };

  const ator = await getAuthenticatedUser();
  if (!ator || !hasPermission(ator.role, "margins:write")) {
    return { erroGeral: "Você não tem permissão para alterar a precificação." };
  }

  const resultado = validarConfiguracao(valores);
  if (!resultado.configuracao) return { erros: resultado.erros };

  try {
    await salvarConfiguracaoDePrecificacao(ator, resultado.configuracao);
  } catch {
    return { erroGeral: "Não foi possível salvar. Verifique se o banco de dados está no ar." };
  }

  revalidatePath("/admin/precificacao");
  revalidatePath("/admin/receitas");
  return { salvo: true };
}
