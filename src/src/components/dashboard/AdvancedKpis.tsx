import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardKpis } from "@/hooks/useDashboardData";
import { useRevenues } from "@/hooks/useRevenues";
import { formatPercent, formatCurrency } from "@/lib/format";
import { AlertTriangle, Receipt, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export function AdvancedKpis() {
  const { data: kpis, isLoading: kpiLoading } = useDashboardKpis();
  const { data: revenues = [], isLoading: revLoading } = useRevenues();
  const isLoading = kpiLoading || revLoading;

  const advanced = useMemo(() => {
    if (!kpis) return { inadimplencia: 0, ticketMedio: 0, margem: 0 };

    const totalParcelas = (kpis.mrr || 0) + (kpis.receitaMes || 0) + (kpis.inadimplencia || 0);
    const inadimplencia = totalParcelas > 0 ? ((kpis.inadimplencia || 0) / totalParcelas) * 100 : 0;

    const activeRevenues = revenues.filter((r) => r.status !== "cancelled");
    const ticketMedio = activeRevenues.length > 0
      ? activeRevenues.reduce((s, r) => s + r.total_amount, 0) / activeRevenues.length
      : 0;

    const receita = kpis.receitaMes || 0;
    const margem = receita > 0 ? ((receita - (kpis.despesasMes || 0)) / receita) * 100 : 0;

    return { inadimplencia, ticketMedio, margem };
  }, [kpis, revenues]);

  const cards = [
    {
      title: "Inadimplência",
      value: formatPercent(advanced.inadimplencia),
      icon: AlertTriangle,
      color: advanced.inadimplencia > 10 ? "text-destructive" : "text-foreground",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(advanced.ticketMedio),
      icon: Receipt,
      color: "text-foreground",
    },
    {
      title: "Margem Operacional",
      value: formatPercent(advanced.margem),
      icon: TrendingUp,
      color: advanced.margem >= 0 ? "text-foreground" : "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
