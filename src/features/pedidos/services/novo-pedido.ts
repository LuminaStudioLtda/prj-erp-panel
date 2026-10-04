import { parseNumeroPtBr } from "@/features/insumos/services/insumo-form";
import type {
  NovoPedidoFormErrors,
  NovoPedidoFormValues,
  NovoPedidoValidado,
  ProdutoParaPedido,
} from "@/features/pedidos/types";

export const VALORES_INICIAIS_DO_PEDIDO: NovoPedidoFormValues = {
  cliente: "",
  contato: "",
  entregaPrevista: "",
  linhas: [],
};

const PADRAO_DE_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function lerDataDoFormulario(texto: string): Date | null {
  const encontrado = PADRAO_DE_DATA.exec(texto);
  if (!encontrado) return null;

  const [, ano, mes, dia] = encontrado.map(Number);
  const data = new Date(ano, mes - 1, dia, 12);
  const valida = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? data : null;
}

export function formatarDataParaFormulario(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Quantidade inteira maior que zero, ou `null`. */
export function lerQuantidadeDoPedido(texto: string): number | null {
  const valor = parseNumeroPtBr(texto);
  return valor !== null && Number.isInteger(valor) && valor > 0 ? valor : null;
}

/** Prazo sugerido: hoje + o maior prazo de confecção entre os produtos escolhidos. */
export function sugerirEntrega(
  linhas: NovoPedidoFormValues["linhas"],
  produtos: ProdutoParaPedido[],
  hoje: Date,
): string {
  const dias = linhas
    .map((linha) => produtos.find((p) => p.id === linha.produtoId)?.diasDeConfeccao ?? 0)
    .reduce((maior, atual) => Math.max(maior, atual), 0);
  if (dias <= 0) return "";

  const entrega = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias, 12);
  return formatarDataParaFormulario(entrega);
}

export function calcularTotalDoPedido(
  linhas: NovoPedidoFormValues["linhas"],
  produtos: ProdutoParaPedido[],
): number {
  const total = linhas.reduce((soma, linha) => {
    const produto = produtos.find((p) => p.id === linha.produtoId);
    const quantidade = lerQuantidadeDoPedido(linha.quantidade);
    return produto && quantidade ? soma + produto.preco * quantidade : soma;
  }, 0);
  return Math.round((total + Number.EPSILON) * 100) / 100;
}

export type ResultadoDaValidacaoDoPedido =
  | { pedido: NovoPedidoValidado; erros?: undefined }
  | { pedido?: undefined; erros: NovoPedidoFormErrors };

export function validarNovoPedido(
  valores: NovoPedidoFormValues,
  produtos: ProdutoParaPedido[],
): ResultadoDaValidacaoDoPedido {
  const erros: NovoPedidoFormErrors = {};

  const cliente = valores.cliente.trim();
  if (cliente.length < 2) erros.cliente = "Informe o nome do cliente.";

  const contato = valores.contato.trim();
  if (contato.length > 80) erros.contato = "Use no máximo 80 caracteres.";

  let entregaPrevista: Date | null = null;
  if (valores.entregaPrevista.trim() !== "") {
    entregaPrevista = lerDataDoFormulario(valores.entregaPrevista);
    if (!entregaPrevista) erros.entregaPrevista = "Informe uma data válida.";
  }

  const itens: NovoPedidoValidado["itens"] = [];
  if (valores.linhas.length === 0) {
    erros.linhas = "Adicione ao menos um produto ao pedido.";
  } else {
    for (const linha of valores.linhas) {
      const quantidade = lerQuantidadeDoPedido(linha.quantidade);
      if (!produtos.some((p) => p.id === linha.produtoId) || quantidade === null) {
        erros.linhas = "Informe uma quantidade inteira maior que zero para cada produto.";
        break;
      }
      itens.push({ produtoId: linha.produtoId, quantidade });
    }
  }

  if (Object.keys(erros).length > 0) return { erros };
  return { pedido: { cliente, contato: contato || null, entregaPrevista, itens } };
}
