export type StatusDoPedido =
  | "DRAFT"
  | "AWAITING_PRODUCTION"
  | "AWAITING_PAYMENT"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type ItemDoPedido = {
  produtoId: string | null;
  nome: string;
  quantidade: number;
  precoUnitario: number;
};

export type PedidoDaLista = {
  id: string;
  codigo: string;
  cliente: string;
  contato: string | null;
  status: StatusDoPedido;
  total: number;
  criadoEm: Date;
  entregaPrevista: Date | null;
  itens: ItemDoPedido[];
};

export type ProdutoParaPedido = {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  /** Prazo de confecção sob encomenda, em dias; `null` quando não definido. */
  diasDeConfeccao: number | null;
};

/** Linha do pedido como o usuário a edita: a quantidade é texto. */
export type LinhaDoNovoPedido = {
  produtoId: string;
  quantidade: string;
};

export type NovoPedidoFormValues = {
  cliente: string;
  contato: string;
  /** Formato AAAA-MM-DD, como o `<input type="date">`. */
  entregaPrevista: string;
  linhas: LinhaDoNovoPedido[];
};

export type NovoPedidoFormErrors = Partial<Record<"cliente" | "contato" | "entregaPrevista" | "linhas", string>>;

export type NovoPedidoValidado = {
  cliente: string;
  contato: string | null;
  entregaPrevista: Date | null;
  itens: { produtoId: string; quantidade: number }[];
};

export type FaltaDeMaterial = {
  materialId: string;
  nome: string;
  necessario: number;
  disponivel: number;
  unidade: string;
};
