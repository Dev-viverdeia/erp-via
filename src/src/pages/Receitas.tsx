import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRevenues, type Revenue } from "@/hooks/useRevenues";
import { RevenueFormDialog } from "@/components/revenues/RevenueFormDialog";
import { RevenueDetailPanel } from "@/components/revenues/RevenueDetailPanel";
import { RevenueDeleteDialog } from "@/components/revenues/RevenueDeleteDialog";
import { RevenueCancelDialog } from "@/components/revenues/RevenueCancelDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Search, Eye, Pencil, XCircle, Trash2,
  TrendingUp, DollarSign, Clock, Download, MoreHorizontal, ArrowUpRight,
} from "lucide-react";
import { exportToCsv } from "@/lib/csv-export";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const revenueStatusMap: Record<string, { label: string; status: "info" | "success" | "neutral" }> = {
  active: { label: "Ativa", status: "info" },
  completed: { label: "Concluida", status: "success" },
  cancelled: { label: "Cancelada", status: "neutral" },
};

const paymentTypeLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartao",
  recurring: "Recorrente",
};

const Receitas = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const { data: revenues = [], isLoading } = useRevenues(search || undefined, statusFilter, paymentTypeFilter);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [detailRevenue, setDetailRevenue] = useState<Revenue | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  // KPI — current month
  const kpis = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const thisMonth = revenues.filter((r) => {
      const d = new Date(r.contracted_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const total = thisMonth.reduce((s, r) => s + r.total_amount, 0);
    const completed = thisMonth.filter((r) => r.status === "completed").reduce((s, r) => s + r.total_amount, 0);
    const active = thisMonth.filter((r) => r.status === "active").reduce((s, r) => s + r.total_amount, 0);
    return { total, completed, active };
  }, [revenues]);

  const handleExport = () => {
    exportToCsv(
      "receitas",
      ["Cliente", "Valor", "Tipo", "Parcelas", "Status", "Contratacao"],
      revenues.map((r) => [
        r.partners?.name || "—",
        formatCurrency(r.total_amount),
        paymentTypeLabels[r.payment_type] || r.payment_type,
        `${r.installments_count}x`,
        revenueStatusMap[r.status]?.label || r.status,
        formatDate(r.contracted_at),
      ])
    );
  };

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold opacity-80 block mb-3">
                Contas a Receber
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Receitas</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9 px-4 rounded-full text-base cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
              <Button
                onClick={() => { setEditingRevenue(null); setFormOpen(true); }}
                className="h-9 px-5 rounded-full text-base font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Nova Receita
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={TrendingUp}
              label="Total do Mes"
              value={kpis.total}
              color="text-foreground"
              iconColor="text-primary"
              loading={isLoading}
            />
            <KpiItem
              icon={DollarSign}
              label="Recebido"
              value={kpis.completed}
              color="text-accent"
              iconColor="text-accent"
              loading={isLoading}
            />
            <KpiItem
              icon={Clock}
              label="Provisionado"
              value={kpis.active}
              color="text-status-info"
              iconColor="text-status-info"
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
            placeholder="Buscar por cliente..."
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
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="completed">Concluida</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
          <SelectTrigger className="w-40 h-10 rounded-full bg-card border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pix">Pix</SelectItem>
            <SelectItem value="card">Cartao</SelectItem>
            <SelectItem value="recurring">Recorrente</SelectItem>
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
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Cliente</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor Total</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Tipo</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-center">Parcelas</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Contratacao</TableHead>
                  <TableHead className="px-6 py-4 w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhuma receita encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  revenues.map((rev) => {
                    const s = revenueStatusMap[rev.status] || revenueStatusMap.active;
                    return (
                      <TableRow
                        key={rev.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setDetailRevenue(rev)}
                      >
                        <TableCell className="px-6 py-4">
                          <div>
                            <p className="text-md font-semibold text-foreground">{rev.partners?.name || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-md font-bold tabular-nums text-foreground">
                            {formatCurrency(rev.total_amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-base text-muted-foreground">
                            {paymentTypeLabels[rev.payment_type] || rev.payment_type}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className="text-base text-muted-foreground tabular-nums">{rev.installments_count}x</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={s.status} variant="lighter">{s.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-base text-muted-foreground">{formatDate(rev.contracted_at)}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => setDetailRevenue(rev)} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditingRevenue(rev); setFormOpen(true); }} className="cursor-pointer">
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              {rev.status === "active" && (
                                <DropdownMenuItem onClick={() => setCancelId(rev.id)} className="cursor-pointer">
                                  <XCircle className="h-4 w-4 mr-2" /> Cancelar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteId(rev.id)} className="text-destructive cursor-pointer">
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

            {revenues.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{revenues.length} registro(s)</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Dialogs */}
      <RevenueFormDialog open={formOpen} onOpenChange={setFormOpen} revenue={editingRevenue} />
      <RevenueDetailPanel open={!!detailRevenue} onOpenChange={(o) => !o && setDetailRevenue(null)} revenue={detailRevenue} />
      <RevenueDeleteDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} revenueId={deleteId} />
      <RevenueCancelDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} revenueId={cancelId} />
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

export default Receitas;
