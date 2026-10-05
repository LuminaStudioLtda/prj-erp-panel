import { LoginForm } from "@/features/auth/components/LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-6">
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
