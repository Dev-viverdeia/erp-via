import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { useBudgetVsActual } from "@/hooks/useBudgetVsActual";
import { useBudgetScenarios } from "@/hooks/useBudgetScenarios";
import { formatCurrency, formatPercent } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";

/* ---- Types ---- */
interface AggregatedAccount {
  name: string;
  budget: number;
  actual: number;
  type: string;
}

interface ChartTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

/* ---- Type labels ---- */
const typeLabels: Record<string, string> = {
  asset: "ATIVO",
  liability: "PASSIVO",
  equity: "PATRIMONIO LIQUIDO",
  revenue: "RECEITAS",
  expense: "DESPESAS",
};

const typeOrder = ["revenue", "expense", "asset", "liability", "equity"];

/* ---- KPI Item ---- */
function KpiItem({
  icon: Icon,
  label,
  value,
  color,
  iconColor,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <span className={`text-xl font-bold tracking-tight ${color}`}>
            {formatCurrency(value)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- Custom Tooltip for Chart ---- */
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
        <div key={entry.name} className="flex items-center justify-between gap-4">
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

/* ---- Variance status ---- */
function getVarianceStatus(variancePct: number): {
  label: string;
  className: string;
} {
  const abs = Math.abs(variancePct);
  if (abs < 10)
    return {
      label: "Dentro",
      className: "bg-status-success/15 text-status-success border-status-success/20",
    };
  if (abs < 20)
    return {
      label: "Atencao",
      className: "bg-status-warning/15 text-status-warning border-status-warning/20",
    };
  return {
    label: "Estouro",
    className: "bg-destructive/15 text-destructive border-destructive/20",
  };
}

/* ---- Main Component ---- */
const OrcadoVsRealizadoPage = () => {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [scenarioId, setScenarioId] = useState<string>("");
  const [showTable, setShowTable] = useState(false);

  const { data: scenarios = [], isLoading: loadingScenarios } = useBudgetScenarios(
    parseInt(year)
  );

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  // Auto-select first scenario
  const effectiveScenarioId = scenarioId || scenarios[0]?.id || "";

  const {
    data: rows = [],
    isLoading,
    isError,
    refetch,
  } = useBudgetVsActual(effectiveScenarioId || undefined, parseInt(year));

  // Aggregated KPIs
  const kpis = useMemo(() => {
    const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    const variance = totalActual - totalBudget;
    return { totalBudget, totalActual, variance };
  }, [rows]);

  // Chart data aggregated by account
  const chartData = useMemo(() => {
    const byAccount = new Map<string, AggregatedAccount>();
    for (const row of rows) {
      const existing = byAccount.get(row.account_id) || {
        name: `${row.code} ${row.name}`,
        budget: 0,
        actual: 0,
        type: row.type,
      };
      existing.budget += row.budget;
      existing.actual += row.actual;
      byAccount.set(row.account_id, existing);
    }
    return Array.from(byAccount.values()).filter(
      (d) => d.budget > 0 || d.actual > 0
    );
  }, [rows]);

  // Grouped data for table
  const tableData = useMemo(() => {
    const byAccount = new Map<
      string,
      {
        account_id: string;
        code: string;
        name: string;
        type: string;
        budget: number;
        actual: number;
        variance: number;
        variance_pct: number;
      }
    >();
    for (const row of rows) {
      const existing = byAccount.get(row.account_id) || {
        account_id: row.account_id,
        code: row.code,
        name: row.name,
        type: row.type,
        budget: 0,
        actual: 0,
        variance: 0,
        variance_pct: 0,
      };
      existing.budget += row.budget;
      existing.actual += row.actual;
      existing.variance = existing.actual - existing.budget;
      existing.variance_pct =
        existing.budget !== 0
          ? (existing.variance / Math.abs(existing.budget)) * 100
          : existing.actual !== 0
            ? 100
            : 0;
      byAccount.set(row.account_id, existing);
    }
    return Array.from(byAccount.values());
  }, [rows]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof tableData>();
    for (const row of tableData) {
      if (!map.has(row.type)) map.set(row.type, []);
      map.get(row.type)!.push(row);
    }
    return map;
  }, [tableData]);

  const handleExport = () => {
    if (!tableData || tableData.length === 0) return;
    exportToCsv(
      "orcado-vs-realizado",
      ["Codigo", "Conta", "Tipo", "Orcado", "Realizado", "Variacao R$", "Variacao %", "Status"],
      tableData.map((r) => {
        const status = getVarianceStatus(r.variance_pct);
        return [
          r.code,
          r.name,
          typeLabels[r.type] || r.type,
          formatCurrency(r.budget),
          formatCurrency(r.actual),
          formatCurrency(r.variance),
          formatPercent(r.variance_pct),
          status.label,
        ];
      })
    );
  };

  const loading = isLoading || loadingScenarios;

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
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
              <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold opacity-80 block mb-3">
                Analise de Variacao
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Orcado vs Realizado
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!tableData || tableData.length === 0}
                className="h-9 px-4 rounded-full text-base cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={Target}
              label="Orcado Total"
              value={kpis.totalBudget}
              color="text-primary"
              iconColor="text-primary"
              loading={loading}
            />
            <KpiItem
              icon={TrendingUp}
              label="Realizado Total"
              value={kpis.totalActual}
              color="text-accent"
              iconColor="text-accent"
              loading={loading}
            />
            <KpiItem
              icon={TrendingDown}
              label="Variacao"
              value={kpis.variance}
              color={kpis.variance >= 0 ? "text-status-success" : "text-destructive"}
              iconColor={kpis.variance >= 0 ? "text-status-success" : "text-destructive"}
              loading={loading}
            />
          </div>
        </div>
      </section>

      {/* ===== BAR CHART ===== */}
      <section className="glass-panel p-6 md:p-8 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Orcado vs Realizado por Conta
            </h2>
            <p className="text-sm text-muted-foreground">
              Comparacao agregada por conta contabil
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
              Erro ao carregar dados de orcamento
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
              Selecione um cenario para visualizar a analise
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              Sem dados de orcamento no periodo selecionado
            </p>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(400, chartData.length * 40)}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 140, right: 30, top: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
                width={130}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar
                dataKey="budget"
                name="Orcado"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="actual"
                name="Realizado"
                fill="hsl(var(--accent))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ===== COLLAPSIBLE TABLE ===== */}
      <section className="glass-panel overflow-hidden">
        <button
          onClick={() => setShowTable((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 md:px-8 py-5 cursor-pointer hover:bg-muted/20 transition-colors duration-200"
          aria-expanded={showTable}
        >
          <span className="text-md font-semibold text-foreground">
            Mostrar tabela detalhada
          </span>
          {showTable ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showTable && (
          <div className="border-t border-border">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
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
                  onClick={() => refetch()}
                  className="cursor-pointer"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : tableData.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">
                  Sem dados no periodo
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                      Conta
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                      Orcado
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                      Realizado
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                      Variacao R$
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                      Variacao %
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeOrder.flatMap((type) => {
                    const group = grouped.get(type);
                    if (!group || group.length === 0) return [];
                    const groupBudget = group.reduce((s, r) => s + r.budget, 0);
                    const groupActual = group.reduce((s, r) => s + r.actual, 0);
                    const groupVariance = groupActual - groupBudget;
                    const groupVariancePct =
                      groupBudget !== 0
                        ? (groupVariance / Math.abs(groupBudget)) * 100
                        : 0;

                    return [
                      <TableRow key={`header-${type}`}>
                        <TableCell
                          colSpan={6}
                          className="bg-muted/50 font-semibold text-2xs uppercase tracking-[0.15em] px-6 py-3"
                        >
                          {typeLabels[type] || type}
                        </TableCell>
                      </TableRow>,
                      ...group.map((row) => {
                        const status = getVarianceStatus(row.variance_pct);
                        return (
                          <TableRow
                            key={row.account_id}
                            className="border-b border-border hover:bg-muted/30 transition-colors duration-200"
                          >
                            <TableCell className="px-6 py-3 text-base text-foreground">
                              <span className="font-mono text-xs text-muted-foreground mr-2">
                                {row.code}
                              </span>
                              {row.name}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-right text-base tabular-nums">
                              {formatCurrency(row.budget)}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-right text-base tabular-nums">
                              {formatCurrency(row.actual)}
                            </TableCell>
                            <TableCell
                              className={`px-6 py-3 text-right text-base font-medium tabular-nums ${
                                row.variance < 0 ? "text-destructive" : "text-status-success"
                              }`}
                            >
                              {formatCurrency(row.variance)}
                            </TableCell>
                            <TableCell
                              className={`px-6 py-3 text-right text-base font-medium tabular-nums ${
                                row.variance_pct < 0 ? "text-destructive" : "text-status-success"
                              }`}
                            >
                              {formatPercent(row.variance_pct)}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <Badge
                                variant="outline"
                                className={`text-2xs ${status.className}`}
                              >
                                {status.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      }),
                      <TableRow
                        key={`subtotal-${type}`}
                        className="border-t border-border"
                      >
                        <TableCell className="px-6 py-3 font-semibold text-xs text-muted-foreground">
                          Subtotal {typeLabels[type]}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right font-semibold text-xs tabular-nums">
                          {formatCurrency(groupBudget)}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right font-semibold text-xs tabular-nums">
                          {formatCurrency(groupActual)}
                        </TableCell>
                        <TableCell
                          className={`px-6 py-3 text-right font-semibold text-xs tabular-nums ${
                            groupVariance < 0
                              ? "text-destructive"
                              : "text-status-success"
                          }`}
                        >
                          {formatCurrency(groupVariance)}
                        </TableCell>
                        <TableCell
                          className={`px-6 py-3 text-right font-semibold text-xs tabular-nums ${
                            groupVariancePct < 0
                              ? "text-destructive"
                              : "text-status-success"
                          }`}
                        >
                          {formatPercent(groupVariancePct)}
                        </TableCell>
                        <TableCell className="px-6 py-3" />
                      </TableRow>,
                    ];
                  })}
                </TableBody>
                {tableData.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell className="px-6 py-4 font-bold text-sm">
                        TOTAL
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-sm tabular-nums">
                        {formatCurrency(kpis.totalBudget)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-sm tabular-nums">
                        {formatCurrency(kpis.totalActual)}
                      </TableCell>
                      <TableCell
                        className={`px-6 py-4 text-right font-bold text-sm tabular-nums ${
                          kpis.variance < 0
                            ? "text-destructive"
                            : "text-status-success"
                        }`}
                      >
                        {formatCurrency(kpis.variance)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-sm tabular-nums">
                        {kpis.totalBudget !== 0
                          ? formatPercent(
                              (kpis.variance / Math.abs(kpis.totalBudget)) * 100
                            )
                          : "--"}
                      </TableCell>
                      <TableCell className="px-6 py-4" />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrcadoVsRealizadoPage;
