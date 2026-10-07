import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/** Estado visual do card; os dados reais serão ligados quando o módulo existir. */
export function OfficeStatusCard() {
  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-col gap-1">
        <CardTitle className="text-base">Status da Oficina</CardTitle>
        <CardDescription>
          Indicadores de produção aparecerão aqui.
        </CardDescription>
      </div>
      <Badge tone="neutral">Aguardando dados</Badge>
    </Card>
  );
}
