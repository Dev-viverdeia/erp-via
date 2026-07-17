import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Gauge,
  Target,
  Flame,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialIndicators } from "@/hooks/useFinancialIndicators";
import { useBudgetVsActual } from "@/hooks/useBudgetVsActual";
import { useBudgetScenarios } from "@/hooks/useBudgetScenarios";
import { formatCurrency, formatPercent } from "@/lib/format";

/* ---- Types ---- */
interface ChartTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

/* ---- Month names ---- */
const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/* ---- Custom Tooltip ---- */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-panel p-3 rounded-lg text-sm space-y-1 min-w-[180px]">
      <p className="font-semibold text-foreground text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground text-xs">{entry.name}</span>
          </div>
          <span className="font-semibold text-foreground text-xs tabular-nums">
            {formatCurrency(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---- Progress bar ---- */
function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const clampedWidth = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clampedWidth}%` }}
      />
    </div>
  );
}

/* ---- KPI Glass Card ---- */
function KpiCard({
  icon: Icon,
  label,
  value,
  textValue,
  color,
  iconColor,
  bgColor,
  loading,
  subtitle,
  progressValue,
  progressColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  textValue?: string;
  color: string;
  iconColor: string;
  bgColor: string;
  loading: boolean;
  subtitle?: string;
  progressValue?: number;
  progressColor?: string;
}) {
  return (
    <div className="glass-card p-6 rounded-[20px]">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-32 mb-2" />
      ) : (
        <span
          className={`text-2xl font-bold tracking-tight tabular-nums block mb-1 ${color}`}
        >
          {textValue ??
            (value !== undefined ? formatCurrency(value) : "--")}
        </span>
      )}
      {subtitle && !loading && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
      {progressValue !== undefined && progressColor && !loading && (
        <div className="mt-3">
          <ProgressBar value={progressValue} color={progressColor} />
          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
            {formatPercent(progressValue)}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---- Main Component ---- */
const IndicadoresPage = () => {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));

  const {
    data: indicators,
    isLoading: loadingIndicators,
    isError: isErrorIndicators,
    refetch: refetchIndicators,
  } = useFinancialIndicators(parseInt(year));

  // Budget adherence -- get the first approved or first available scenario
  const { data: scenarios = [], isLoading: loadingScenarios } = useBudgetScenarios(
    parseInt(year)
  );
  const activeScenario = useMemo(
    () => scenarios.find((s) => s.status === "approved") ?? scenarios[0],
    [scenarios]
  );
  const { data: budgetRows = [], isLoading: loadingBudget } = useBudgetVsActual(
    activeScenario?.id,
    parseInt(year)
  );

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
  const loading = loadingIndicators || loadingScenarios || loadingBudget;
  const isError = isErrorIndicators;

  // Budget adherence calculation
  const adherence = useMemo(() => {
    if (budgetRows.length === 0) return 0;
    const totalBudget = budgetRows.reduce((s, r) => s + r.budget, 0);
    const totalActual = budgetRows.reduce((s, r) => s + r.actual, 0);
    if (totalBudget === 0) return 0;
    return (totalActual / totalBudget) * 100;
  }, [budgetRows]);

  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    if (!indicators?.monthlyData) return [];
    return indicators.monthlyData.map((d) => ({
      name: monthNames[d.month - 1],
      receita: d.receita,
      despesa: d.despesa,
    }));
  }, [indicators]);

  // Monthly bar chart (receita vs despesa side by side)
  const barChartData = useMemo(() => {
    if (!indicators?.monthlyData) return [];
    return indicators.monthlyData.map((d) => ({
      name: monthNames[d.month - 1],
      receita: d.receita,
      despesa: d.despesa,
      resultado: d.receita - d.despesa,
    }));
  }, [indicators]);

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-status-warning/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <NavLink
            to="/controladoria"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Controladoria
          </NavLink>

          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-status-warning font-semibold opacity-80 block mb-3">
                Indicadores Financeiros
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Indicadores
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-24 h-9 rounded-full bg-card border-border cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={yr} className="cursor-pointer">
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* ===== KPI GRID (2x3) ===== */}
      {isError ? (
        <section className="glass-panel p-8">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-sm text-muted-foreground">
              Erro ao carregar indicadores financeiros
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchIndicators()}
              className="cursor-pointer"
            >
              Tentar novamente
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            icon={TrendingUp}
            label="Receita Total"
            value={indicators?.receita}
            color="text-status-success"
            iconColor="text-status-success"
            bgColor="bg-status-success/10"
            loading={loading}
            subtitle={`Ano ${year}`}
          />
          <KpiCard
            icon={TrendingDown}
            label="Despesa Total"
            value={indicators?.despesa}
            color="text-destructive"
            iconColor="text-destructive"
            bgColor="bg-destructive/10"
            loading={loading}
            subtitle={`Ano ${year}`}
          />
          <KpiCard
            icon={DollarSign}
            label="Resultado"
            value={indicators?.resultado}
            color={
              (indicators?.resultado ?? 0) >= 0
                ? "text-status-success"
                : "text-destructive"
            }
            iconColor={
              (indicators?.resultado ?? 0) >= 0
                ? "text-status-success"
                : "text-destructive"
            }
            bgColor={
              (indicators?.resultado ?? 0) >= 0
                ? "bg-status-success/10"
                : "bg-destructive/10"
            }
            loading={loading}
            subtitle={
              (indicators?.resultado ?? 0) >= 0 ? "Lucro" : "Prejuizo"
            }
          />
          <KpiCard
            icon={Gauge}
            label="Margem Operacional"
            textValue={
              indicators
                ? formatPercent(indicators.margemOperacional)
                : undefined
            }
            color="text-primary"
            iconColor="text-primary"
            bgColor="bg-primary/10"
            loading={loading}
            progressValue={
              indicators
                ? Math.min(100, Math.max(0, indicators.margemOperacional))
                : undefined
            }
            progressColor="bg-primary"
          />
          <KpiCard
            icon={Target}
            label="Aderencia Orcamentaria"
            textValue={formatPercent(adherence)}
            color="text-accent"
            iconColor="text-accent"
            bgColor="bg-accent/10"
            loading={loading}
            progressValue={Math.min(100, Math.max(0, adherence))}
            progressColor="bg-accent"
          />
          <KpiCard
            icon={Flame}
            label="Burn Rate"
            value={indicators?.burnRate}
            color="text-status-warning"
            iconColor="text-status-warning"
            bgColor="bg-status-warning/10"
            loading={loading}
            subtitle="por mes"
          />
        </div>
      )}

      {/* ===== CHARTS SECTION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Receita vs Despesa Bar Chart */}
        <section className="glass-panel p-6 md:p-8 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Receita vs Despesa
              </h2>
              <p className="text-sm text-muted-foreground">
                Comparativo mensal
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-muted-foreground">
                Erro ao carregar dados
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchIndicators()}
                className="cursor-pointer"
              >
                Tentar novamente
              </Button>
            </div>
          ) : barChartData.every(
              (d) => d.receita === 0 && d.despesa === 0
            ) ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">
                Sem dados no periodo selecionado
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={barChartData}
                margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v)}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar
                  dataKey="receita"
                  name="Receita"
                  fill="hsl(var(--status-success))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesa"
                  name="Despesa"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Evolucao Area Chart */}
        <section className="glass-panel p-6 md:p-8 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Evolucao Receita vs Despesa
              </h2>
              <p className="text-sm text-muted-foreground">
                Tendencia ao longo dos meses
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-muted-foreground">
                Erro ao carregar dados
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchIndicators()}
                className="cursor-pointer"
              >
                Tentar novamente
              </Button>
            </div>
          ) : monthlyChartData.every(
              (d) => d.receita === 0 && d.despesa === 0
            ) ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">
                Sem dados no periodo selecionado
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={monthlyChartData}
                margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient
                    id="gradientReceita"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--status-success))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--status-success))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="gradientDespesa"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--destructive))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--destructive))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v)}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area
                  type="monotone"
                  dataKey="receita"
                  name="Receita"
                  stroke="hsl(var(--status-success))"
                  strokeWidth={2}
                  fill="url(#gradientReceita)"
                />
                <Area
                  type="monotone"
                  dataKey="despesa"
                  name="Despesa"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fill="url(#gradientDespesa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </div>
  );
};

export default IndicadoresPage;
