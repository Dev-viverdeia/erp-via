import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  BarChart3,
  DollarSign,
  Calculator,
  ArrowUpRight,
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
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
import { useBudgetVsActual } from "@/hooks/useBudgetVsActual";
import { useBudgetScenarios } from "@/hooks/useBudgetScenarios";
import { formatCurrency, formatPercent } from "@/lib/format";

/* ---- Types ---- */
interface ChartDataPoint {
  name: string;
  orcado: number;
  realizado: number | null;
  forecast: number | null;
}

interface ChartTooltipPayloadItem {
  name: string;
  value: number | null;
  color: string;
  dataKey: string;
}

/* ---- KPI Item ---- */
function KpiItem({
  icon: Icon,
  label,
  value,
  textValue,
  color,
  iconColor,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  textValue?: string;
  color: string;
  iconColor: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
        <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <span className={`text-xl font-bold tracking-tight ${color}`}>
            {textValue ?? (value !== undefined ? formatCurrency(value) : "--")}
          </span>
        )}
      </div>
    </div>
  );
}

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
      {payload.map((entry) => {
        if (entry.value === null || entry.value === undefined) return null;
        return (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground text-xs">
                {entry.name}
              </span>
            </div>
            <span className="font-semibold text-foreground text-xs tabular-nums">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        );
      })}
    </div>
  );
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

/* ---- Main Component ---- */
const ForecastPage = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const [year, setYear] = useState(String(now.getFullYear()));
  const [scenarioId, setScenarioId] = useState<string>("");

  const { data: scenarios = [], isLoading: loadingScenarios } = useBudgetScenarios(
    parseInt(year)
  );

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
  const effectiveScenarioId = scenarioId || scenarios[0]?.id || "";

  const {
    data: budgetRows = [],
    isLoading,
    isError,
    refetch,
  } = useBudgetVsActual(effectiveScenarioId || undefined, parseInt(year));

  const loading = isLoading || loadingScenarios;

  // Chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    return monthNames.map((name, i) => {
      const month = i + 1;
      const monthBudget = budgetRows
        .filter((r) => r.month === month)
        .reduce((s, r) => s + r.budget, 0);
      const monthActual = budgetRows
        .filter((r) => r.month === month)
        .reduce((s, r) => s + r.actual, 0);

      // Forecast: average of last 3 realized months
      let forecast: number | null = null;
      if (month > currentMonth) {
        const recentActuals: number[] = [];
        for (let m = Math.max(1, currentMonth - 2); m <= currentMonth; m++) {
          const monthTotal = budgetRows
            .filter((r) => r.month === m)
            .reduce((s, r) => s + r.actual, 0);
          if (monthTotal > 0) recentActuals.push(monthTotal);
        }
        forecast =
          recentActuals.length > 0
            ? recentActuals.reduce((s, v) => s + v, 0) / recentActuals.length
            : monthBudget;
      }

      return {
        name,
        orcado: monthBudget,
        realizado: month <= currentMonth ? monthActual : null,
        forecast: month > currentMonth ? forecast : null,
      };
    });
  }, [budgetRows, currentMonth]);

  // Summary KPIs
  const summaryKpis = useMemo(() => {
    const totalRealized = chartData.reduce(
      (s, d) => s + (d.realizado ?? 0),
      0
    );
    const totalForecast = chartData.reduce(
      (s, d) => s + (d.forecast ?? 0),
      0
    );
    const totalBudget = chartData.reduce((s, d) => s + d.orcado, 0);
    const totalProjected = totalRealized + totalForecast;
    const adherence =
      totalBudget > 0 ? (totalProjected / totalBudget) * 100 : 0;

    // Trend: compare last 3 months realized vs previous 3
    const recentMonths: number[] = [];
    const prevMonths: number[] = [];
    for (let m = Math.max(1, currentMonth - 2); m <= currentMonth; m++) {
      const val = chartData[m - 1]?.realizado ?? 0;
      if (val > 0) recentMonths.push(val);
    }
    for (let m = Math.max(1, currentMonth - 5); m <= Math.max(0, currentMonth - 3); m++) {
      if (m >= 1 && m <= 12) {
        const val = chartData[m - 1]?.realizado ?? 0;
        if (val > 0) prevMonths.push(val);
      }
    }
    const recentAvg =
      recentMonths.length > 0
        ? recentMonths.reduce((s, v) => s + v, 0) / recentMonths.length
        : 0;
    const prevAvg =
      prevMonths.length > 0
        ? prevMonths.reduce((s, v) => s + v, 0) / prevMonths.length
        : 0;
    const trendUp = recentAvg >= prevAvg;

    return {
      totalRealized,
      totalForecast,
      totalProjected,
      totalBudget,
      adherence,
      trendUp,
    };
  }, [chartData, currentMonth]);

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-status-success/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <NavLink
            to="/controladoria"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Controladoria
          </NavLink>

          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-status-success font-semibold opacity-80 block mb-3">
                Projecao Financeira
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Forecast
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={effectiveScenarioId}
                onValueChange={setScenarioId}
              >
                <SelectTrigger className="w-48 h-9 rounded-full bg-card border-border cursor-pointer">
                  <SelectValue placeholder="Cenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="cursor-pointer"
                    >
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={Calculator}
              label="Resultado Projetado"
              value={summaryKpis.totalProjected}
              color={
                summaryKpis.totalProjected >= 0
                  ? "text-status-success"
                  : "text-destructive"
              }
              iconColor="text-status-success"
              loading={loading}
            />
            <KpiItem
              icon={CheckCircle2}
              label="Aderencia Projetada"
              textValue={formatPercent(summaryKpis.adherence)}
              color="text-accent"
              iconColor="text-accent"
              loading={loading}
            />
            <KpiItem
              icon={summaryKpis.trendUp ? TrendingUp : TrendingDown}
              label="Tendencia"
              textValue={summaryKpis.trendUp ? "Em alta" : "Em queda"}
              color={
                summaryKpis.trendUp ? "text-status-success" : "text-destructive"
              }
              iconColor={
                summaryKpis.trendUp ? "text-status-success" : "text-destructive"
              }
              loading={loading}
            />
          </div>
        </div>
      </section>

      {/* ===== COMPOSED CHART ===== */}
      <section className="glass-panel p-6 md:p-8 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-status-success/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-status-success" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-foreground">
              Orcado vs Realizado vs Forecast
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Barras = realizado, linha solida = orcado, linha tracejada =
              forecast
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-sm text-muted-foreground">
              Erro ao carregar dados de forecast
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="cursor-pointer"
            >
              Tentar novamente
            </Button>
          </div>
        ) : !effectiveScenarioId ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              Selecione um cenario para visualizar o forecast
            </p>
          </div>
        ) : chartData.every(
            (d) => d.orcado === 0 && !d.realizado && !d.forecast
          ) ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              Sem dados de orcamento no periodo selecionado
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={chartData}
              margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
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
                  fontSize: 11,
                }}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar
                dataKey="realizado"
                name="Realizado"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="orcado"
                name="Orcado"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="hsl(var(--status-success))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--status-success))", r: 3 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-[1.25rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Total Realizado
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {formatCurrency(summaryKpis.totalRealized)}
            </span>
          )}
          <p className="text-[12px] text-muted-foreground mt-2">
            Ate o mes {currentMonth} de {year}
          </p>
        </div>

        <div className="glass-card p-6 rounded-[1.25rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-status-success/10 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-status-success" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Total Forecast
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <span className="text-2xl font-bold text-status-success tracking-tight tabular-nums">
              {formatCurrency(summaryKpis.totalForecast)}
            </span>
          )}
          <p className="text-[12px] text-muted-foreground mt-2">
            Projecao meses {currentMonth + 1} a 12
          </p>
        </div>

        <div className="glass-card p-6 rounded-[1.25rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Total Projetado
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <span
              className={`text-2xl font-bold tracking-tight tabular-nums ${
                summaryKpis.totalProjected >= 0
                  ? "text-foreground"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(summaryKpis.totalProjected)}
            </span>
          )}
          <p className="text-[12px] text-muted-foreground mt-2">
            Realizado + Forecast
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
