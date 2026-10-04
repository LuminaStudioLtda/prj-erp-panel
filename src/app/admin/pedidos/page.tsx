import type { Metadata } from "next";
import { PedidosView } from "@/features/pedidos/components/PedidosView";
import { listarPedidos } from "@/features/pedidos/services/pedidos-db";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Gestão de Pedidos | Admin",
};

export default async function GestaoDePedidosPage() {
  const { pedidos, produtos, bancoDisponivel } = await listarPedidos(await getAuthenticatedUser());

  return <PedidosView pedidos={pedidos} produtos={produtos} agora={new Date()} bancoDisponivel={bancoDisponivel} />;
}
