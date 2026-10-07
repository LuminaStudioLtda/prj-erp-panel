import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import { getCurrentUser } from "@/features/auth/services/current-user";

export const metadata = { title: "Painel · Lumina ERP" };

export default async function AdminPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-4 px-4 py-10">
      <h1 className="text-3xl font-semibold">Painel administrativo</h1>
      <p className="text-muted">Conectado como {user?.name}.</p>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </main>
  );
}
