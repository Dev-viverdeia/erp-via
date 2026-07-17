import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
import { ArrowLeft, Plus, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useBudgetScenarios,
  useCreateBudgetScenario,
} from "@/hooks/useBudgetScenarios";
import { useBudgetLines, useUpsertBudgetLines } from "@/hooks/useBudgetLines";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

/* ---- Constants ---- */
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
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const budgetTypes = ["revenue", "expense"] as const;
const typeLabels: Record<string, string> = {
  revenue: "Receitas",
  expense: "Despesas",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  approved: "Aprovado",
  archived: "Arquivado",
};
const statusColors: Record<string, string> = {
  draft: "bg-status-warning/15 text-status-warning border-status-warning/30",
  approved:
    "bg-status-success/15 text-status-success border-status-success/30",
  archived: "bg-muted/40 text-muted-foreground border-border",
};

const yearOptions = [2025, 2026, 2027, 2028];

/* ---- KPI Item (matches project pattern) ---- */
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

/* ---- Custom Tooltip for chart ---- */
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-card px-4 py-3 rounded-xl border border-border shadow-lg">
      <p className="text-[12px] font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-[12px]">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---- Main Page ---- */
const OrcamentoPage = () => {
  /* ---- Year filter ---- */
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  /* ---- Scenarios ---- */
  const {
    data: scenarios = [],
    isLoading: loadingScenarios,
    isError: errorScenarios,
    refetch: refetchScenarios,
  } = useBudgetScenarios(selectedYear);
  const createScenario = useCreateBudgetScenario();

  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(
    undefined
  );

  // Auto-select first scenario when list changes
  useEffect(() => {
    if (scenarios.length > 0 && !scenarios.find((s) => s.id === selectedScenario)) {
      setSelectedScenario(scenarios[0].id);
    } else if (scenarios.length === 0) {
      setSelectedScenario(undefined);
    }
  }, [scenarios, selectedScenario]);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenario),
    [scenarios, selectedScenario]
  );

  /* ---- Accounts ---- */
  const {
    data: allAccounts = [],
    isLoading: loadingAccounts,
    isError: errorAccounts,
    refetch: refetchAccounts,
  } = useChartOfAccounts();

  // Only analytical revenue & expense accounts for the budget grid
  const budgetAccounts = useMemo(
    () =>
      allAccounts
        .filter(
          (a) =>
            a.is_analytical &&
            a.is_active &&
            (a.type === "revenue" || a.type === "expense")
        )
        .sort((a, b) => a.code.localeCompare(b.code)),
    [allAccounts]
  );

  /* ---- Budget lines ---- */
  const {
    data: budgetLines = [],
    isLoading: loadingLines,
    isError: errorLines,
    refetch: refetchLines,
  } = useBudgetLines(selectedScenario);
  const upsertLines = useUpsertBudgetLines();

  /* ---- Local amount state (Map<"accountId-month", number>) ---- */
  const [amounts, setAmounts] = useState<Map<string, number>>(new Map());
  const [isDirty, setIsDirty] = useState(false);

  // Initialize amounts from loaded budget lines
  useEffect(() => {
    const next = new Map<string, number>();
    for (const line of budgetLines) {
      next.set(`${line.account_id}-${line.month}`, line.amount);
    }
    setAmounts(next);
    setIsDirty(false);
  }, [budgetLines]);

  const getAmount = useCallback(
    (accountId: string, month: number): string => {
      const key = `${accountId}-${month}`;
      const val = amounts.get(key);
      return val !== undefined ? String(val) : "";
    },
    [amounts]
  );

  const setAmount = useCallback(
    (accountId: string, month: number, value: number) => {
      setAmounts((prev) => {
        const next = new Map(prev);
        if (isNaN(value)) {
          next.delete(`${accountId}-${month}`);
        } else {
          next.set(`${accountId}-${month}`, value);
        }
        return next;
      });
      setIsDirty(true);
    },
    []
  );

  /* ---- Computed totals ---- */
  const getRowTotal = useCallback(
    (accountId: string): number => {
      let total = 0;
      for (const m of months) {
        const val = amounts.get(`${accountId}-${m}`);
        if (val) total += val;
      }
      return total;
    },
    [amounts]
  );

  const getTypeMonthTotal = useCallback(
    (type: string, month: number): number => {
      let total = 0;
      for (const account of budgetAccounts) {
        if (account.type !== type) continue;
        const val = amounts.get(`${account.id}-${month}`);
        if (val) total += val;
      }
      return total;
    },
    [amounts, budgetAccounts]
  );

  const getTypeTotal = useCallback(
    (type: string): number => {
      let total = 0;
      for (const m of months) {
        total += getTypeMonthTotal(type, m);
      }
      return total;
    },
    [getTypeMonthTotal]
  );

  /* ---- KPI values ---- */
  const totalReceitas = useMemo(() => getTypeTotal("revenue"), [getTypeTotal]);
  const totalDespesas = useMemo(() => getTypeTotal("expense"), [getTypeTotal]);

  /* ---- Chart data ---- */
  const chartData = useMemo(() => {
    return months.map((m) => ({
      name: monthNames[m - 1],
      Receitas: getTypeMonthTotal("revenue", m),
      Despesas: getTypeMonthTotal("expense", m),
    }));
  }, [getTypeMonthTotal]);

  /* ---- Save ---- */
  const handleSave = () => {
    if (!selectedScenario) return;
    const lines: Array<{
      scenario_id: string;
      account_id: string;
      cost_center_id: string | null;
      month: number;
      amount: number;
    }> = [];
    amounts.forEach((amount, key) => {
      if (amount === 0) return;
      const dashIndex = key.lastIndexOf("-");
      const accountId = key.substring(0, dashIndex);
      const monthStr = key.substring(dashIndex + 1);
      lines.push({
        scenario_id: selectedScenario,
        account_id: accountId,
        cost_center_id: null,
        month: Number(monthStr),
        amount,
      });
    });
    upsertLines.mutate(lines, {
      onSuccess: () => {
        toast.success("Orcamento salvo com sucesso");
        setIsDirty(false);
      },
      onError: (err: Error) => {
        toast.error(`Erro ao salvar: ${err.message}`);
      },
    });
  };

  /* ---- New scenario dialog ---- */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newDesc, setNewDesc] = useState("");

  const handleCreateScenario = () => {
    if (!newName.trim()) {
      toast.error("Nome do cenario e obrigatorio");
      return;
    }
    createScenario.mutate(
      { name: newName.trim(), year: newYear, description: newDesc.trim() || null },
      {
        onSuccess: (data) => {
          toast.success("Cenario criado com sucesso");
          setDialogOpen(false);
          setNewName("");
          setNewDesc("");
          setSelectedYear(newYear);
          setSelectedScenario(data.id);
        },
        onError: (err: Error) => {
          toast.error(`Erro ao criar cenario: ${err.message}`);
        },
      }
    );
  };

  /* ---- Loading state ---- */
  const isLoading = loadingScenarios || loadingAccounts || loadingLines;

  /* ---- Error state ---- */
  const hasError = errorScenarios || errorAccounts || errorLines;
  if (hasError) {
    return (
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <Link
            to="/controladoria"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Controladoria
          </Link>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-muted-foreground text-sm">
              Erro ao carregar dados do orcamento.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                refetchScenarios();
                refetchAccounts();
                refetchLines();
              }}
              className="rounded-full cursor-pointer"
            >
              Tentar novamente
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== HERO ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <Link
            to="/controladoria"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Controladoria
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold opacity-80 block mb-3">
                PLANEJAMENTO ORCAMENTARIO
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Orcamento
              </h1>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Year selector */}
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-24 h-9 rounded-full bg-card border-border text-[13px] cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Scenario selector */}
              {scenarios.length > 0 && (
                <Select
                  value={selectedScenario ?? ""}
                  onValueChange={setSelectedScenario}
                >
                  <SelectTrigger className="w-48 h-9 rounded-full bg-card border-border text-[13px] cursor-pointer">
                    <SelectValue placeholder="Selecionar cenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Scenario status badge */}
              {activeScenario && (
                <Badge
                  variant="outline"
                  className={`text-[10px] rounded-full px-3 py-1 ${statusColors[activeScenario.status] || statusColors.draft}`}
                >
                  {statusLabels[activeScenario.status] || activeScenario.status}
                </Badge>
              )}

              {/* New scenario button */}
              <Button
                variant="outline"
                onClick={() => setDialogOpen(true)}
                className="h-9 px-4 rounded-full text-[13px] cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cenario
              </Button>

              {/* Save button */}
              {selectedScenario && (
                <Button
                  onClick={handleSave}
                  disabled={upsertLines.isPending || !isDirty}
                  className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {upsertLines.isPending ? "Salvando..." : "Salvar"}
                </Button>
              )}
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={Target}
              label="Total Receitas"
              value={totalReceitas}
              color="text-status-success"
              iconColor="text-status-success"
              loading={isLoading}
            />
            <KpiItem
              icon={Target}
              label="Total Despesas"
              value={totalDespesas}
              color="text-status-warning"
              iconColor="text-status-warning"
              loading={isLoading}
            />
            <KpiItem
              icon={Target}
              label="Resultado"
              value={totalReceitas - totalDespesas}
              color={
                totalReceitas - totalDespesas >= 0
                  ? "text-status-success"
                  : "text-destructive"
              }
              iconColor="text-primary"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== EMPTY STATE (no scenarios) ===== */}
      {!loadingScenarios && scenarios.length === 0 && (
        <section className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Target className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Nenhum cenario encontrado
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Crie seu primeiro cenario orcamentario para comecar o planejamento
              financeiro de {selectedYear}.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cenario
            </Button>
          </div>
        </section>
      )}

      {/* ===== BUDGET GRID ===== */}
      {selectedScenario && (
        <section className="glass-panel overflow-hidden">
          <div className="px-6 md:px-8 pt-6 pb-2">
            <h2 className="text-[15px] font-bold text-foreground mb-1">
              Planilha Orcamentaria
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Insira os valores mensais para cada conta. Clique em Salvar para
              persistir as alteracoes.
            </p>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : budgetAccounts.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Nenhuma conta analitica de receita ou despesa cadastrada no plano
              de contas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold min-w-[200px]">
                      Conta
                    </th>
                    {months.map((m) => (
                      <th
                        key={m}
                        className="px-2 py-3 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold min-w-[100px]"
                      >
                        {monthNames[m - 1]}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold min-w-[120px]">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgetTypes.map((type) => {
                    const typeAccounts = budgetAccounts.filter(
                      (a) => a.type === type
                    );
                    if (typeAccounts.length === 0) return null;
                    return (
                      <AccountTypeGroup
                        key={type}
                        type={type}
                        typeLabel={typeLabels[type]}
                        accounts={typeAccounts}
                        getAmount={getAmount}
                        setAmount={setAmount}
                        getRowTotal={getRowTotal}
                        getTypeMonthTotal={getTypeMonthTotal}
                        getTypeTotal={getTypeTotal}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ===== SUMMARY CHART ===== */}
      {selectedScenario && !isLoading && budgetAccounts.length > 0 && (
        <section className="glass-panel p-6 md:p-8">
          <h2 className="text-[15px] font-bold text-foreground mb-1">
            Visao Mensal
          </h2>
          <p className="text-[12px] text-muted-foreground mb-6">
            Receitas vs Despesas por mes
          </p>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
                <Bar
                  dataKey="Receitas"
                  fill="hsl(var(--status-success))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Despesas"
                  fill="hsl(var(--status-warning))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ===== NEW SCENARIO DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Novo Cenario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="scenario-name" className="text-[13px]">
                Nome
              </Label>
              <Input
                id="scenario-name"
                placeholder="Ex: Orcamento Base 2026"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-year" className="text-[13px]">
                Ano
              </Label>
              <Select
                value={String(newYear)}
                onValueChange={(v) => setNewYear(Number(v))}
              >
                <SelectTrigger
                  id="scenario-year"
                  className="h-10 cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-desc" className="text-[13px]">
                Descricao{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="scenario-desc"
                placeholder="Breve descricao do cenario"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="h-10"
              />
            </div>
            <Button
              onClick={handleCreateScenario}
              disabled={createScenario.isPending || !newName.trim()}
              className="w-full h-10 rounded-full text-[13px] font-semibold cursor-pointer"
            >
              {createScenario.isPending ? "Criando..." : "Criar Cenario"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---- Account Type Group (extracted to avoid Fragment key issues) ---- */
interface AccountTypeGroupProps {
  type: string;
  typeLabel: string;
  accounts: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
  }>;
  getAmount: (accountId: string, month: number) => string;
  setAmount: (accountId: string, month: number, value: number) => void;
  getRowTotal: (accountId: string) => number;
  getTypeMonthTotal: (type: string, month: number) => number;
  getTypeTotal: (type: string) => number;
}

function AccountTypeGroup({
  type,
  typeLabel,
  accounts,
  getAmount,
  setAmount,
  getRowTotal,
  getTypeMonthTotal,
  getTypeTotal,
}: AccountTypeGroupProps) {
  return (
    <>
      {/* Type header row */}
      <tr className="border-b border-border bg-muted/20">
        <td
          colSpan={14}
          className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground"
        >
          {typeLabel}
        </td>
      </tr>
      {/* Account rows */}
      {accounts.map((account) => (
        <tr
          key={account.id}
          className="border-b border-border hover:bg-muted/10 transition-colors duration-150"
        >
          <td className="sticky left-0 z-10 bg-card px-4 py-1.5 text-[13px] text-foreground">
            <span className="text-muted-foreground text-[11px] font-mono mr-2">
              {account.code}
            </span>
            {account.name}
          </td>
          {months.map((m) => (
            <td key={m} className="px-1 py-1">
              <Input
                type="number"
                value={getAmount(account.id, m)}
                onChange={(e) =>
                  setAmount(account.id, m, Number(e.target.value))
                }
                className="h-8 text-[13px] text-right tabular-nums bg-transparent border-transparent hover:border-border focus:border-primary w-full transition-colors duration-200"
                aria-label={`${account.name} - ${monthNames[m - 1]}`}
              />
            </td>
          ))}
          <td className="px-4 py-1.5 text-right text-[13px] font-bold tabular-nums">
            {formatCurrency(getRowTotal(account.id))}
          </td>
        </tr>
      ))}
      {/* Subtotal row */}
      <tr className="border-b border-border bg-muted/10">
        <td className="sticky left-0 z-10 bg-card px-4 py-2 text-[12px] font-bold text-foreground">
          Subtotal {typeLabel}
        </td>
        {months.map((m) => (
          <td
            key={m}
            className="px-2 py-2 text-center text-[12px] font-bold tabular-nums text-foreground"
          >
            {formatCurrency(getTypeMonthTotal(type, m))}
          </td>
        ))}
        <td className="px-4 py-2 text-right text-[13px] font-bold tabular-nums text-primary">
          {formatCurrency(getTypeTotal(type))}
        </td>
      </tr>
    </>
  );
}

export default OrcamentoPage;
