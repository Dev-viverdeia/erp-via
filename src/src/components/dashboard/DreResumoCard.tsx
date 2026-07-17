import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDreResumo } from "@/hooks/useDreResumo";
import { formatCurrency } from "@/lib/format";

export function DreResumoCard() {
  const { data: dre, isLoading } = useDreResumo();

  const lines = [
    { label: "Receita Bruta", value: dre.receitaBruta, bold: true },
    { label: "(-) Despesas Operacionais", value: -dre.despesasOperacionais, bold: false },
    { label: "= Resultado Operacional", value: dre.resultado, bold: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">DRE Resumida (mês atual)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.label} className="flex items-center justify-between">
                <span className={`text-sm ${line.bold ? "font-semibold" : "text-muted-foreground"}`}>
                  {line.label}
                </span>
                <span
                  className={`text-sm tabular-nums ${
                    line.bold ? "font-bold" : ""
                  } ${line.value < 0 ? "text-destructive" : ""}`}
                >
                  {formatCurrency(Math.abs(line.value))}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
