import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgingRecebiveis } from "@/hooks/useAgingRecebiveis";
import { formatCurrency } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function AgingChart() {
  const { data: faixas, isLoading } = useAgingRecebiveis();

  const chartData = (faixas || []).map((f) => ({
    name: f.faixa.replace("A vencer ", "").replace("Vencida ", "V "),
    valor: f.valor,
    tipo: f.tipo,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aging de Recebíveis</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Valor"]}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.tipo === "a_vencer" ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
