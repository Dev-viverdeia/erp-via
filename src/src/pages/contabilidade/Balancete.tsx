import { useState, useMemo } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Scale,
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
import { useBalancete, type BalanceteRow } from "@/hooks/useAccountingReports";
import { formatCurrency } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";

const typeLabels: Record<string, string> = {
  asset: "ATIVO",
  liability: "PASSIVO",
  equity: "PATRIMONIO LIQUIDO",
  revenue: "RECEITAS",
  expense: "DESPESAS",
};

const typeOrder = ["asset", "liability", "equity", "revenue", "expense"];

const months = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/* ---- KPI Item (matches Receitas.tsx pattern) ---- */
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
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
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

/* ---- Main Page Component ---- */
const BalancetePage = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [showTable, setShowTable] = useState(false);

  const y = parseInt(year);
  const m = parseInt(month);
  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0).toISOString().split("T")[0];

  const { data: rows, isLoading, isError, refetch } = useBalancete(startDate, endDate);

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  // KPI totals
  const kpis = useMemo(() => {
    if (!rows || rows.length === 0) return { totalDebit: 0, totalCredit: 0, diff: 0 };
    const totalDebit = rows.reduce((s, r) => s + r.total_debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.total_credit, 0);
    return { totalDebit, totalCredit, diff: totalDebit - totalCredit };
  }, [rows]);

  // Chart data
  const chartData = useMemo(() => {
    if (!rows) return [];
    return rows
      .filter((r) => r.total_debit > 0 || r.total_credit > 0)
      .map((r) => ({
        name: r.code + " " + r.name.substring(0, 20),
        debit: r.total_debit,
        credit: r.total_credit,
        accountId: r.account_id,
      }));
  }, [rows]);

  // Grouped data for table
  const grouped = useMemo(() => {
    const map = new Map<string, BalanceteRow[]>();
    for (const row of rows || []) {
      if (!map.has(row.type)) map.set(row.type, []);
      map.get(row.type)!.push(row);
    }
    return map;
  }, [rows]);

  const handleExport = () => {
    if (!rows) return;
    exportToCsv(
      "balancete",
      ["Codigo", "Conta", "Tipo", "Debitos", "Creditos", "Saldo"],
      rows.map((r) => [
        r.code,
        r.name,
        typeLabels[r.type] || r.type,
        formatCurrency(r.total_debit),
        formatCurrency(r.total_credit),
        formatCurrency(r.balance),
      ])
    );
  };

  const handleBarClick = (data: { accountId?: string }) => {
    if (data.accountId) {
      navigate(`/contabilidade/razao?account=${data.accountId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-status-info/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <NavLink
            to="/contabilidade"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Contabilidade
          </NavLink>

          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-status-info font-semibold opacity-80 block mb-3">
                Balancete de Verificacao
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Balancete
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-36 h-9 rounded-full bg-card border-border cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((label, i) => (
                    <SelectItem key={i} value={String(i + 1)} className="cursor-pointer">
                      {label}
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
                disabled={!rows || rows.length === 0}
                className="h-9 px-4 rounded-full text-base cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={TrendingUp}
              label="Total Debitos"
              value={kpis.totalDebit}
              color="text-primary"
              iconColor="text-primary"
              loading={isLoading}
            />
            <KpiItem
              icon={TrendingDown}
              label="Total Creditos"
              value={kpis.totalCredit}
              color="text-destructive"
              iconColor="text-destructive"
              loading={isLoading}
            />
            <KpiItem
              icon={Scale}
              label="Diferenca"
              value={kpis.diff}
              color={kpis.diff === 0 ? "text-accent" : "text-status-warning"}
              iconColor={kpis.diff === 0 ? "text-accent" : "text-status-warning"}
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== BAR CHART ===== */}
      <section className="glass-panel p-6 md:p-8 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-status-info/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-status-info" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Distribuicao por Conta
            </h2>
            <p className="text-sm text-muted-foreground">
              Clique em uma barra para ver o razao da conta
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-sm text-muted-foreground">
              Erro ao carregar dados do balancete
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
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              Sem movimentacao no periodo selecionado
            </p>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(400, chartData.length * 35)}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 120, right: 30, top: 10, bottom: 10 }}
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
                width={110}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar
                dataKey="debit"
                name="Debito"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={handleBarClick}
              />
              <Bar
                dataKey="credit"
                name="Credito"
                fill="hsl(var(--destructive))"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={handleBarClick}
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
            {isLoading ? (
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
            ) : rows && rows.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">
                  Sem movimentacao no periodo
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                      Codigo
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                      Conta
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                      Debitos
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                      Creditos
                    </TableHead>
                    <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                      Saldo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeOrder.flatMap((type) => {
                    const group = grouped.get(type);
                    if (!group || group.length === 0) return [];
                    const groupDebit = group.reduce((s, r) => s + r.total_debit, 0);
                    const groupCredit = group.reduce((s, r) => s + r.total_credit, 0);
                    const groupBalance = group.reduce((s, r) => s + r.balance, 0);

                    return [
                      <TableRow key={`header-${type}`}>
                        <TableCell
                          colSpan={5}
                          className="bg-muted/50 font-semibold text-2xs uppercase tracking-[0.15em] px-6 py-3"
                        >
                          {typeLabels[type] || type}
                        </TableCell>
                      </TableRow>,
                      ...group.map((row) => (
                        <TableRow
                          key={row.account_id}
                          className="border-b border-border hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/contabilidade/razao?account=${row.account_id}`
                            )
                          }
                        >
                          <TableCell className="px-6 py-3 font-mono text-xs text-muted-foreground">
                            {row.code}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-base text-foreground">
                            {row.name}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-right text-base tabular-nums">
                            {row.total_debit > 0
                              ? formatCurrency(row.total_debit)
                              : "\u2014"}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-right text-base tabular-nums">
                            {row.total_credit > 0
                              ? formatCurrency(row.total_credit)
                              : "\u2014"}
                          </TableCell>
                          <TableCell
                            className={`px-6 py-3 text-right text-base font-medium tabular-nums ${
                              row.balance < 0 ? "text-destructive" : ""
                            }`}
                          >
                            {formatCurrency(row.balance)}
                          </TableCell>
                        </TableRow>
                      )),
                      <TableRow
                        key={`subtotal-${type}`}
                        className="border-t border-border"
                      >
                        <TableCell className="px-6 py-3" />
                        <TableCell className="px-6 py-3 font-semibold text-xs text-muted-foreground">
                          Subtotal {typeLabels[type]}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right font-semibold text-xs tabular-nums">
                          {formatCurrency(groupDebit)}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right font-semibold text-xs tabular-nums">
                          {formatCurrency(groupCredit)}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right font-semibold text-xs tabular-nums">
                          {formatCurrency(groupBalance)}
                        </TableCell>
                      </TableRow>,
                    ];
                  })}
                </TableBody>
                {rows && rows.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell className="px-6 py-4" />
                      <TableCell className="px-6 py-4 font-bold text-sm">
                        TOTAL
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-sm tabular-nums">
                        {formatCurrency(kpis.totalDebit)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-sm tabular-nums">
                        {formatCurrency(kpis.totalCredit)}
                      </TableCell>
                      <TableCell
                        className={`px-6 py-4 text-right font-bold text-sm tabular-nums ${
                          kpis.diff !== 0 ? "text-status-warning" : ""
                        }`}
                      >
                        {formatCurrency(kpis.diff)}
                      </TableCell>
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

export default BalancetePage;
