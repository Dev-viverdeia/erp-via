import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardKpis, useRevenueExpenseMonthly, useRecentRevenues } from "@/hooks/useDashboardData";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useDreResumo } from "@/hooks/useDreResumo";
import { useAgingRecebiveis } from "@/hooks/useAgingRecebiveis";
import { useRevenues } from "@/hooks/useRevenues";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Landmark, RefreshCw,
  AlertTriangle, Receipt, CalendarDays,
} from "lucide-react";
import { useMemo } from "react";

const statusConfig: Record<string, { label: string; status: "success" | "info" | "error" | "neutral" }> = {
  active: { label: "Ativa", status: "info" },
  completed: { label: "Concluida", status: "success" },
  cancelled: { label: "Cancelada", status: "neutral" },
};
const paymentTypeLabels: Record<string, string> = {
  pix: "Pix", card: "Cartao", recurring: "Recorrente",
};

const Dashboard = () => {
  const { data: kpis, isLoading: kpiLoading } = useDashboardKpis();
  const { data: cashFlow, isLoading: cfLoading } = useCashFlow(90);
  const { data: revExp, isLoading: reLoading } = useRevenueExpenseMonthly();
  const { data: dre, isLoading: dreLoading } = useDreResumo();
  const { data: aging, isLoading: agingLoading } = useAgingRecebiveis();
  const { data: revenues = [] } = useRevenues();
  const { data: recentRevs, isLoading: recentLoading } = useRecentRevenues(8);

  const cfChartData = (cashFlow?.projection ?? []).filter((_, i) => i % 3 === 0);

  const advanced = useMemo(() => {
    if (!kpis) return { inadimplencia: 0, ticketMedio: 0, margem: 0 };
    const totalParcelas = (kpis.mrr || 0) + (kpis.receitaMes || 0) + (kpis.inadimplencia || 0);
    const inadimplencia = totalParcelas > 0 ? ((kpis.inadimplencia || 0) / totalParcelas) * 100 : 0;
    const activeRevenues = revenues.filter((r) => r.status !== "cancelled");
    const ticketMedio = activeRevenues.length > 0
      ? activeRevenues.reduce((s, r) => s + r.total_amount, 0) / activeRevenues.length : 0;
    const receita = kpis.receitaMes || 0;
    const margem = receita > 0 ? ((receita - (kpis.despesasMes || 0)) / receita) * 100 : 0;
    return { inadimplencia, ticketMedio, margem };
  }, [kpis, revenues]);

  const agingData = (aging || []).map((f) => ({
    name: f.faixa.replace("A vencer ", "").replace("Vencida ", "V "),
    valor: f.valor, tipo: f.tipo,
  }));

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ===== HERO: Financial Pulse ===== */}
      <section>
        <div className="glass-panel p-8 md:p-10 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">
            {/* Left: KPIs */}
            <div className="flex-1 min-w-0">
              <span className="text-[11px] uppercase tracking-[0.25em] text-accent font-semibold opacity-80 block mb-4">
                Visao Financeira
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2 leading-[1.1]">
                Dashboard
              </h1>
              <p className="text-muted-foreground text-[14px] mb-8 max-w-md">
                <span className="capitalize">{today}</span>
              </p>

              {kpiLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-[12px] text-muted-foreground font-medium">Receita do Mes</span>
                    <span className="text-xl font-semibold text-accent">{formatCurrency(kpis?.receitaMes ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-[12px] text-muted-foreground font-medium">Despesas do Mes</span>
                    <span className="text-xl font-semibold text-destructive">{formatCurrency(kpis?.despesasMes ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-[12px] text-muted-foreground font-medium">Saldo Total</span>
                    <span className="text-xl font-semibold text-foreground">{formatCurrency(kpis?.saldoTotal ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground font-medium">Resultado</span>
                    <span className={`text-xl font-semibold text-glow-cyan ${(kpis?.resultado ?? 0) >= 0 ? "text-accent" : "text-destructive"}`}>
                      {formatCurrency(kpis?.resultado ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Cash Flow chart */}
            <div className="flex-1 min-w-0 h-72 relative bg-card/80 rounded-xl border border-border p-4 backdrop-blur-md">
              {cfLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : (
                <>
                  <div className="absolute top-3 left-4 z-10">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Fluxo de Caixa — 90 dias
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cfChartData}>
                      <defs>
                        <linearGradient id="cfGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="saldo" name="Saldo" stroke="url(#cfGradient)" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== METRIC CARDS ROW ===== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={RefreshCw} label="MRR" value={formatCurrency(kpis?.mrr ?? 0)} color="text-primary" iconColor="text-primary" loading={kpiLoading} />
        <MetricCard icon={AlertTriangle} label="Inadimplencia" value={formatPercent(advanced.inadimplencia)} color={advanced.inadimplencia > 10 ? "text-destructive" : "text-foreground"} iconColor="text-status-warning" loading={kpiLoading} />
        <MetricCard icon={Receipt} label="Ticket Medio" value={formatCurrency(advanced.ticketMedio)} color="text-foreground" iconColor="text-accent" loading={kpiLoading} />
        <MetricCard icon={TrendingUp} label="Margem Operacional" value={formatPercent(advanced.margem)} color={advanced.margem >= 0 ? "text-accent" : "text-destructive"} iconColor="text-accent" loading={kpiLoading} />
      </section>

      {/* ===== CHARTS GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expense — 2 cols */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-tight text-foreground">Receita vs. Despesa</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">6 meses</span>
          </div>
          <div className="h-[280px]">
            {reLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revExp ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* DRE + Aging stacked — 1 col */}
        <div className="space-y-6">
          {/* DRE */}
          <div className="glass-panel p-6">
            <h2 className="text-[15px] font-bold tracking-tight text-foreground mb-4">DRE Resumida</h2>
            {dreLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-[13px] font-semibold text-foreground">Receita Bruta</span>
                  <span className="text-[13px] font-bold tabular-nums text-foreground">{formatCurrency(dre.receitaBruta)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-[13px] text-muted-foreground">(-) Despesas</span>
                  <span className="text-[13px] tabular-nums text-muted-foreground">{formatCurrency(dre.despesasOperacionais)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[13px] font-semibold text-foreground">= Resultado</span>
                  <span className={`text-[14px] font-bold tabular-nums ${dre.resultado >= 0 ? "text-accent text-glow-cyan" : "text-destructive"}`}>
                    {formatCurrency(dre.resultado)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Aging */}
          <div className="glass-panel p-6">
            <h2 className="text-[15px] font-bold tracking-tight text-foreground mb-4">Aging de Recebiveis</h2>
            {agingLoading ? (
              <Skeleton className="h-[160px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={agingData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Valor"]} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {agingData.map((entry, index) => (
                      <Cell key={index} fill={entry.tipo === "a_vencer" ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ===== RECENT TRANSACTIONS ===== */}
      <section className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">Ultimas Receitas</h2>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Recente</span>
        </div>
        {recentLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="px-8 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Cliente</TableHead>
                <TableHead className="px-8 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Tipo</TableHead>
                <TableHead className="px-8 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                <TableHead className="px-8 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentRevs ?? []).map((rev: any) => {
                const sc = statusConfig[rev.status] ?? { label: rev.status, status: "neutral" as const };
                return (
                  <TableRow key={rev.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="px-8 py-5">
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{rev.partners?.name ?? "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(rev.contracted_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-[13px] text-muted-foreground">{paymentTypeLabels[rev.payment_type] ?? rev.payment_type}</TableCell>
                    <TableCell className="px-8 py-5">
                      <StatusBadge status={sc.status} variant="lighter">{sc.label}</StatusBadge>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right font-bold text-accent text-[14px]">
                      +{formatCurrency(Number(rev.total_amount))}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!recentRevs || recentRevs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma receita encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
};

/* ---- Reusable metric card ---- */
function MetricCard({ icon: Icon, label, value, color, iconColor, loading }: {
  icon: any; label: string; value: string; color: string; iconColor: string; loading: boolean;
}) {
  return (
    <div className="glass-card p-5 group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center group-hover:border-primary/20 transition-colors">
          <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
        </div>
      </div>
      <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1">{label}</h3>
      {loading ? <Skeleton className="h-6 w-20" /> : <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>}
    </div>
  );
}

export default Dashboard;
