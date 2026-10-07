import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { StockLevelBar } from "@/components/ui/stock-level-bar";

export const metadata = { title: "Design System · Lumina ERP" };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col gap-12 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
          Earth &amp; Thread
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Design System</h1>
        <p className="max-w-prose text-muted">
          Tokens, tipografia e componentes base do painel Lumina.
        </p>
      </header>

      <Section title="Cores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["canvas", "bg-canvas"],
            ["surface", "bg-surface"],
            ["ink", "bg-ink"],
            ["terracotta", "bg-terracotta"],
            ["sage", "bg-sage"],
            ["ochre", "bg-ochre"],
            ["critical", "bg-critical"],
            ["border", "bg-border"],
          ].map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-2">
              <div className={`h-14 rounded-lg border border-border ${cls}`} />
              <span className="text-sm text-muted">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografia">
        <div className="flex flex-col gap-2">
          <p className="font-heading text-4xl">Playfair Display — títulos</p>
          <p className="text-base">Work Sans — texto de interface e dados.</p>
          <p className="text-sm text-muted">Texto secundário e metadados.</p>
        </div>
      </Section>

      <Section title="Botões">
        <div className="flex flex-wrap gap-3">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Desabilitado</Button>
        </div>
      </Section>

      <Section title="Campos">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ds-nome" className="text-sm font-medium">
              Nome
            </label>
            <Input id="ds-nome" placeholder="Digite um nome" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ds-email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="ds-email"
              defaultValue="valor-invalido"
              aria-invalid
              aria-describedby="ds-email-erro"
            />
            <p id="ds-email-erro" className="text-sm text-destructive">
              Informe um e-mail válido.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Chips">
        <div className="flex flex-wrap gap-2">
          <Chip selected>Todos</Chip>
          <Chip>Em andamento</Chip>
          <Chip>Concluídos</Chip>
        </div>
      </Section>

      <Section title="Badges de status">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutro</Badge>
          <Badge tone="primary">Em produção</Badge>
          <Badge tone="success">Concluído</Badge>
          <Badge tone="warning">Aguardando</Badge>
          <Badge tone="critical">Cancelado</Badge>
        </div>
      </Section>

      <Section title="Barra de nível de estoque">
        <div className="flex max-w-md flex-col gap-4">
          {[
            ["Saudável", 80],
            ["Baixo", 30],
            ["Crítico", 10],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="text-muted">{value}%</span>
              </div>
              <StockLevelBar
                label={`Nível ${String(label).toLowerCase()}`}
                value={Number(value)}
                max={100}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Título do card</CardTitle>
            <CardDescription>
              Descrição de apoio em texto secundário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Conteúdo do card sobre superfície branca.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Ação</Button>
            <Button size="sm" variant="ghost">
              Cancelar
            </Button>
          </CardFooter>
        </Card>
      </Section>
    </main>
  );
}
