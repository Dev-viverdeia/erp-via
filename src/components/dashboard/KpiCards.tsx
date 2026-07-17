import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Landmark, RefreshCw, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useDashboardKpis } from "@/hooks/useDashboardData";

export function KpiCards() {
  const { data, isLoading } = useDashboardKpis();

  const kpis = data
    ? [
        {
          label: "Receita do Mes",
          value: data.receitaMes,
          icon: TrendingUp,
          color: "text-accent",
          iconColor: "text-accent",
          badge: "+12.4%",
          badgeColor: "text-accent",
        },
        {
          label: "Despesas do Mes",
          value: data.despesasMes,
          icon: TrendingDown,
          color: "text-destructive",
          iconColor: "text-destructive",
          badge: "-2.4%",
          badgeColor: "text-destructive",
        },
        {
          label: "Resultado",
          value: data.resultado,
          icon: DollarSign,
          color: data.resultado >= 0 ? "text-accent" : "text-destructive",
          iconColor: "text-primary",
          badge: null,
          badgeColor: "",
        },
        {
          label: "Saldo Total",
          value: data.saldoTotal,
          icon: Landmark,
          color: "text-foreground",
          iconColor: "text-primary",
          badge: null,
          badgeColor: "",
        },
        {
          label: "MRR",
          value: data.mrr,
          icon: RefreshCw,
          color: "text-foreground",
          iconColor: "text-accent",
          badge: null,
          badgeColor: "",
        },
        {
          label: "Inadimplencia",
          value: data.inadimplencia,
          icon: AlertTriangle,
          color: "text-status-warning",
          iconColor: "text-status-warning",
          badge: null,
          badgeColor: "",
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel p-6">
            <Skeleton className="h-8 w-8 rounded-xl mb-5" />
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="glass-card p-5 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/20 transition-colors">
              <kpi.icon className={`h-[18px] w-[18px] ${kpi.iconColor}`} />
            </div>
            {kpi.badge && (
              <span className={`text-[11px] font-semibold tracking-wider ${kpi.badgeColor}`}>
                {kpi.badge}
              </span>
            )}
          </div>
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
            {kpi.label}
          </h3>
          <p className={`text-xl font-bold tracking-tight ${kpi.color}`}>
            {formatCurrency(kpi.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
