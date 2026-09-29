export default function Home() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-6 text-ink">
      <section className="w-full max-w-xl border border-border bg-surface p-8 sm:p-12">
        <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
          Lumina
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          ERP Panel
        </h1>
        <p className="mt-4 max-w-prose leading-7 text-muted">
          The project foundation is ready for the operational modules.
        </p>
      </section>
    </main>
  );
}
