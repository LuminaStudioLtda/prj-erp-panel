import { Badge } from "@/components/ui/badge";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="flex max-w-2xl flex-col gap-3">
      <Badge tone="warning">Em breve</Badge>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted">{description}</p>
    </section>
  );
}
