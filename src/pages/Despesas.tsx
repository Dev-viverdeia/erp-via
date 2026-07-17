import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { ExpenseDeleteDialog } from "@/components/expenses/ExpenseDeleteDialog";
import { ExpensePayDialog } from "@/components/expenses/ExpensePayDialog";
import { useExpenses, type Expense } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { formatCurrency, formatDate } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";
import {
  Plus, Search, Pencil, Trash2, CreditCard, Download,
  TrendingDown, AlertTriangle, CheckCircle2, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusMap: Record<string, { label: string; status: "warning" | "success" | "error" | "neutral" }> = {
  pending: { label: "Pendente", status: "warning" },
  paid: { label: "Pago", status: "success" },
  overdue: { label: "Vencido", status: "error" },
  cancelled: { label: "Cancelado", status: "neutral" },
};

const Despesas = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; description: string } | null>(null);
  const [payTarget, setPayTarget] = useState<{ id: string; description: string } | null>(null);

  const { data: expenses = [], isLoading } = useExpenses(search || undefined, statusFilter, categoryFilter);
  const { data: categories = [] } = useExpenseCategories();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const summaries = useMemo(() => {
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.due_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return {
      pending: thisMonth.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0),
      overdue: thisMonth.filter((e) => e.status === "overdue").reduce((s, e) => s + e.amount, 0),
      paid: thisMonth.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses, currentMonth, currentYear]);

  const handleExport = () => {
    exportToCsv(
      "despesas",
      ["Descricao", "Parceiro", "Categoria", "Vencimento", "Valor", "Status"],
      expenses.map((e) => [
        e.description,
        e.partners?.name ?? "—",
        e.expense_categories?.name ?? "—",
        formatDate(e.due_date),
        formatCurrency(e.amount),
        statusMap[e.status]?.label || e.status,
      ])
    );
  };

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-destructive/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-destructive font-semibold opacity-80 block mb-3">
                Contas a Pagar
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Despesas</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9 px-4 rounded-full text-[13px] cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
              <Button
                onClick={() => { setEditingExpense(null); setFormOpen(true); }}
                className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Nova Despesa
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={TrendingDown}
              label="Pendente (mes)"
              value={summaries.pending}
              color="text-status-warning"
              iconColor="text-status-warning"
              loading={isLoading}
            />
            <KpiItem
              icon={AlertTriangle}
              label="Vencido (mes)"
              value={summaries.overdue}
              color="text-destructive"
              iconColor="text-destructive"
              loading={isLoading}
            />
            <KpiItem
              icon={CheckCircle2}
              label="Pago (mes)"
              value={summaries.paid}
              color="text-accent"
              iconColor="text-accent"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== FILTERS ===== */}
      <section className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descricao..."
            className="pl-10 h-10 rounded-full bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10 rounded-full bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-10 rounded-full bg-card border-border">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* ===== DATA TABLE ===== */}
      <section className="glass-panel overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Descricao</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Parceiro</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Categoria</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Vencimento</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="px-6 py-4 w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhuma despesa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((exp) => {
                    const s = statusMap[exp.status] ?? statusMap.pending;
                    return (
                      <TableRow
                        key={exp.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <TableCell className="px-6 py-4">
                          <p className="text-[14px] font-semibold text-foreground">{exp.description}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[13px] text-muted-foreground">{exp.partners?.name ?? "—"}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[13px] text-muted-foreground">{exp.expense_categories?.name ?? "—"}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[13px] text-muted-foreground">{formatDate(exp.due_date)}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-[14px] font-bold tabular-nums text-foreground">
                            {formatCurrency(exp.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={s.status} variant="lighter">{s.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={() => { setEditingExpense(exp); setFormOpen(true); }}
                                className="cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              {exp.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => setPayTarget({ id: exp.id, description: exp.description })}
                                  className="cursor-pointer"
                                >
                                  <CreditCard className="h-4 w-4 mr-2" /> Pagar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget({ id: exp.id, description: exp.description })}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {expenses.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-[12px] text-muted-foreground">{expenses.length} registro(s)</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Dialogs */}
      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} expense={editingExpense} />
      <ExpenseDeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} expenseId={deleteTarget?.id ?? null} expenseDescription={deleteTarget?.description ?? ""} />
      <ExpensePayDialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)} expenseId={payTarget?.id ?? null} expenseDescription={payTarget?.description ?? ""} />
    </div>
  );
};

/* ---- Inline KPI Item ---- */
function KpiItem({ icon: Icon, label, value, color, iconColor, loading }: {
  icon: any; label: string; value: number; color: string; iconColor: string; loading: boolean;
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

export default Despesas;
