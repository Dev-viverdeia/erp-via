import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSales, type Sale } from "@/hooks/useSales";
import { formatCurrency, formatDate } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";
import { toast } from "sonner";
import {
  Plus, Search, Eye, Download, MoreHorizontal,
  ShoppingCart, DollarSign, TrendingUp, FileText,
} from "lucide-react";

const statusMap: Record<string, { label: string; status: "info" | "success" | "neutral" | "error" }> = {
  active: { label: "Ativa", status: "info" },
  completed: { label: "Concluida", status: "success" },
  cancelled: { label: "Cancelada", status: "neutral" },
  refunded: { label: "Reembolsada", status: "error" },
};

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartao",
  recurring: "Recorrente",
  boleto: "Boleto",
  bank_transfer: "Transferencia",
};

const Vendas = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: sales = [], isLoading, isError, refetch } = useSales(search, statusFilter);

  // Compute KPIs
  const kpis = useMemo(() => {
    const totalVendas = sales.length;
    const valorTotal = sales.reduce((sum, s) => sum + (s.total_amount ?? 0), 0);
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;
    const nfsPendentes = sales.filter((s) => s.requires_nf && !s.nf_issued).length;
    return { totalVendas, valorTotal, ticketMedio, nfsPendentes };
  }, [sales]);

  const handleExport = () => {
    exportToCsv(
      "vendas",
      ["Data", "Cliente", "Produto", "Valor Total", "Metodo", "Parcelas", "Status", "NF"],
      sales.map((s) => [
        formatDate(s.sale_date),
        s.partners?.name ?? "",
        s.product_name ?? s.description ?? "",
        formatCurrency(s.total_amount),
        paymentLabels[s.payment_method ?? ""] ?? s.payment_method ?? "",
        `${s.installments_count}x`,
        statusMap[s.status]?.label ?? s.status,
        s.nf_issued ? "Emitida" : s.requires_nf ? "Pendente" : "N/A",
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
              <span className="text-[11px] uppercase tracking-[0.25em] text-accent font-semibold opacity-80 block mb-3">
                Vendas
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Vendas</h1>
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
                onClick={() => toast.info("Em breve")}
                className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Nova Venda
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <KpiItem
              icon={ShoppingCart}
              label="Total Vendas"
              value={kpis.totalVendas}
              color="text-foreground"
              iconColor="text-primary"
              loading={isLoading}
              isCount
            />
            <KpiItem
              icon={DollarSign}
              label="Valor Total"
              value={kpis.valorTotal}
              color="text-accent"
              iconColor="text-accent"
              loading={isLoading}
            />
            <KpiItem
              icon={TrendingUp}
              label="Ticket Medio"
              value={kpis.ticketMedio}
              color="text-status-info"
              iconColor="text-status-info"
              loading={isLoading}
            />
            <KpiItem
              icon={FileText}
              label="NFs Pendentes"
              value={kpis.nfsPendentes}
              color="text-status-warning"
              iconColor="text-status-warning"
              loading={isLoading}
              isCount
            />
          </div>
        </div>
      </section>

      {/* ===== FILTERS ===== */}
      <section className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto ou descricao..."
            className="pl-10 h-10 rounded-full bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-10 rounded-full bg-card border-border cursor-pointer">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">Todos</SelectItem>
            <SelectItem value="active" className="cursor-pointer">Ativa</SelectItem>
            <SelectItem value="completed" className="cursor-pointer">Concluida</SelectItem>
            <SelectItem value="cancelled" className="cursor-pointer">Cancelada</SelectItem>
            <SelectItem value="refunded" className="cursor-pointer">Reembolsada</SelectItem>
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
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-sm text-muted-foreground">Erro ao carregar vendas.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full cursor-pointer">
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Data</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Cliente</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Produto</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor Total</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Metodo</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-center">Parcelas</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">NF</TableHead>
                  <TableHead className="px-6 py-4 w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => {
                    const s = statusMap[sale.status] ?? statusMap.active;
                    return (
                      <TableRow
                        key={sale.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/vendas/${sale.id}`)}
                      >
                        <TableCell className="px-6 py-4">
                          <span className="text-[13px] text-muted-foreground">
                            {formatDate(sale.sale_date)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <p className="text-[14px] font-semibold text-foreground">
                            {sale.partners?.name ?? "\u2014"}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[13px] text-foreground">
                            {sale.product_name ?? sale.description ?? "\u2014"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-[14px] font-bold tabular-nums text-foreground">
                            {formatCurrency(sale.total_amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="secondary" className="text-[11px] rounded-full px-2.5">
                            {paymentLabels[sale.payment_method ?? ""] ?? sale.payment_method ?? "\u2014"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className="text-[13px] text-muted-foreground tabular-nums">
                            {sale.installments_count}x
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={s.status} variant="lighter">{s.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <NfBadge sale={sale} />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => navigate(`/vendas/${sale.id}`)} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" /> Ver detalhes
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

            {sales.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-[12px] text-muted-foreground">{sales.length} registro(s)</span>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

/* ---- NF Badge ---- */
function NfBadge({ sale }: { sale: Sale }) {
  if (sale.nf_issued) {
    return <StatusBadge status="success" variant="lighter">Emitida</StatusBadge>;
  }
  if (sale.requires_nf) {
    return <StatusBadge status="warning" variant="lighter">Pendente</StatusBadge>;
  }
  return <StatusBadge status="neutral" variant="lighter">N/A</StatusBadge>;
}

/* ---- Inline KPI Item ---- */
function KpiItem({ icon: Icon, label, value, color, iconColor, loading, isCount = false }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  iconColor: string;
  loading: boolean;
  isCount?: boolean;
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
            {isCount ? value : formatCurrency(value)}
          </span>
        )}
      </div>
    </div>
  );
}

export default Vendas;
