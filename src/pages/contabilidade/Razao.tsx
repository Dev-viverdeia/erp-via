import { useState, useMemo } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookMarked, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
} from "@/components/ui/table";
import { useRazao } from "@/hooks/useAccountingReports";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { formatCurrency, formatDate } from "@/lib/format";

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
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
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
const RazaoPage = () => {
  const [searchParams] = useSearchParams();
  const initialAccount = searchParams.get("account");

  const now = new Date();
  const [selectedAccount, setSelectedAccount] = useState(initialAccount || "");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const { data: accounts } = useChartOfAccounts();
  const analyticalAccounts = useMemo(
    () => accounts?.filter((a) => a.is_analytical) || [],
    [accounts]
  );

  const y = parseInt(year);
  const m = parseInt(month);
  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0).toISOString().split("T")[0];

  const {
    data: rows,
    isLoading,
    isError,
    refetch,
  } = useRazao(selectedAccount || undefined, startDate, endDate);

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
  const selectedAccountData = accounts?.find((a) => a.id === selectedAccount);

  // Current balance (last entry running balance)
  const currentBalance = useMemo(() => {
    if (!rows || rows.length === 0) return 0;
    return rows[rows.length - 1].running_balance;
  }, [rows]);

  // Chart data
  const chartData = useMemo(() => {
    if (!rows) return [];
    return rows.map((r) => ({
      date: formatDate(r.entry_date),
      balance: r.running_balance,
    }));
  }, [rows]);

  const hasAccount = selectedAccount !== "";

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-status-warning/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <NavLink
            to="/contabilidade"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Contabilidade
          </NavLink>

          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-status-warning font-semibold opacity-80 block mb-3">
                Razao Contabil
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Razao
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-64 h-9 rounded-full bg-card border-border cursor-pointer">
                  <SelectValue placeholder="Selecione uma conta..." />
                </SelectTrigger>
                <SelectContent>
                  {analyticalAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="cursor-pointer">
                      {a.code} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            </div>
          </div>

          {/* KPI Row */}
          {hasAccount && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <KpiItem
                icon={TrendingUp}
                label="Saldo Atual"
                value={currentBalance}
                color={currentBalance >= 0 ? "text-accent" : "text-destructive"}
                iconColor={currentBalance >= 0 ? "text-accent" : "text-destructive"}
                loading={isLoading}
              />
              {selectedAccountData && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                    <BookMarked className="h-[18px] w-[18px] text-status-warning" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
                      Conta
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate block">
                      {selectedAccountData.code} - {selectedAccountData.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Natureza: {selectedAccountData.nature === "debit" ? "Devedora" : "Credora"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== No account selected state ===== */}
      {!hasAccount && (
        <section className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <BookMarked className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Selecione uma conta para visualizar o razao contabil
            </p>
          </div>
        </section>
      )}

      {/* ===== AREA CHART ===== */}
      {hasAccount && (
        <section className="glass-panel p-6 md:p-8 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-status-warning/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-status-warning" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">
                Evolucao do Saldo
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Saldo acumulado ao longo do periodo
              </p>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-[350px] w-full rounded-lg" />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-muted-foreground">
                Erro ao carregar dados do razao
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
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
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
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke="hsl(var(--primary))"
                  fill="url(#balanceGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
      )}

      {/* ===== DETAIL TABLE ===== */}
      {hasAccount && (
        <section className="glass-panel overflow-hidden">
          <div className="px-6 md:px-8 py-5 border-b border-border">
            <h2 className="text-[14px] font-semibold text-foreground">
              Lancamentos do Periodo
            </h2>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-muted-foreground">
                Erro ao carregar lancamentos
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
                Sem movimentacao no periodo selecionado
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold w-28">
                      Data
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                      Lancamento
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                      Descricao
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right w-32">
                      Debito
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right w-32">
                      Credito
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right w-32">
                      Saldo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rows || []).map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors duration-200"
                    >
                      <TableCell className="px-6 py-3 text-[13px] text-muted-foreground tabular-nums">
                        {formatDate(row.entry_date)}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-[13px] text-foreground truncate max-w-[200px]">
                        {row.entry_description}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-[13px] text-muted-foreground">
                        {row.line_description || "\u2014"}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right text-[13px] tabular-nums">
                        {row.debit_amount > 0
                          ? formatCurrency(row.debit_amount)
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right text-[13px] tabular-nums">
                        {row.credit_amount > 0
                          ? formatCurrency(row.credit_amount)
                          : "\u2014"}
                      </TableCell>
                      <TableCell
                        className={`px-6 py-3 text-right text-[13px] font-semibold tabular-nums ${
                          row.running_balance >= 0
                            ? "text-accent"
                            : "text-destructive"
                        }`}
                      >
                        {formatCurrency(row.running_balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {rows && rows.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <span className="text-[12px] text-muted-foreground">
                    {rows.length} lancamento(s)
                  </span>
                  <span
                    className={`text-[13px] font-bold tabular-nums ${
                      currentBalance >= 0 ? "text-accent" : "text-destructive"
                    }`}
                  >
                    Saldo final: {formatCurrency(currentBalance)}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default RazaoPage;
