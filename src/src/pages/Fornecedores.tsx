import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { usePartners, type Partner } from "@/hooks/usePartners";
import { PartnerFormPanel } from "@/components/partners/PartnerFormPanel";
import { PartnerDeleteDialog } from "@/components/partners/PartnerDeleteDialog";
import { formatCurrency } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";
import {
  Plus, Search, Eye, Pencil, Trash2, Truck, DollarSign,
  AlertTriangle, Download, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Fornecedores = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  const { data: partners = [], isLoading } = usePartners(search || undefined, "vendor");

  const { data: expenseData = [], isLoading: isExpenseLoading } = useQuery({
    queryKey: ["vendor-expense-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, partner_id, status")
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
  });

  const kpis = useMemo(() => {
    const partnerIds = new Set(partners.map((p) => p.id));
    const vendorExpenses = expenseData.filter((e) => e.partner_id && partnerIds.has(e.partner_id));
    return {
      totalFornecedores: partners.length,
      despesasTotal: vendorExpenses.reduce((s, e) => s + (e.amount ?? 0), 0),
      pendente: vendorExpenses
        .filter((e) => e.status === "pending" || e.status === "overdue")
        .reduce((s, e) => s + (e.amount ?? 0), 0),
    };
  }, [partners, expenseData]);

  const combinedLoading = isLoading || isExpenseLoading;

  const handleExport = () => {
    exportToCsv(
      "fornecedores",
      ["Nome", "Documento", "Email", "Telefone"],
      partners.map((p) => [
        p.name,
        p.document ?? "",
        p.email ?? "",
        p.phone ?? "",
      ]),
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
              <span className="text-xs uppercase tracking-[0.25em] text-destructive font-semibold opacity-80 block mb-3">
                Gestao de Fornecedores
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Fornecedores</h1>
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
                onClick={() => { setEditingPartner(null); setFormOpen(true); }}
                className="h-9 px-5 rounded-full text-base font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={Truck}
              label="Total Fornecedores"
              value={kpis.totalFornecedores}
              color="text-foreground"
              iconColor="text-muted-foreground"
              loading={combinedLoading}
              isCount
            />
            <KpiItem
              icon={DollarSign}
              label="Despesas Total"
              value={kpis.despesasTotal}
              color="text-destructive"
              iconColor="text-destructive"
              loading={combinedLoading}
            />
            <KpiItem
              icon={AlertTriangle}
              label="Pendente"
              value={kpis.pendente}
              color="text-status-warning"
              iconColor="text-status-warning"
              loading={combinedLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== FILTERS ===== */}
      <section className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou documento..."
            className="pl-10 h-10 rounded-full bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Nome</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Documento</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Email</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Telefone</TableHead>
                  <TableHead className="px-6 py-4 w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhum fornecedor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  partners.map((partner) => (
                    <TableRow
                      key={partner.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/fornecedores/${partner.id}`)}
                    >
                      <TableCell className="px-6 py-4">
                        <p className="text-md font-semibold text-foreground">{partner.name}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-base text-muted-foreground">{partner.document ?? "\u2014"}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-base text-muted-foreground">{partner.email ?? "\u2014"}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-base text-muted-foreground">{partner.phone ?? "\u2014"}</span>
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
                              onClick={() => navigate(`/fornecedores/${partner.id}`)}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" /> Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => { setEditingPartner(partner); setFormOpen(true); }}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(partner)}
                              className="text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {partners.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{partners.length} registro(s)</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Panels / Dialogs */}
      <PartnerFormPanel open={formOpen} onOpenChange={setFormOpen} partner={editingPartner} />
      <PartnerDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        partner={deleteTarget}
      />
    </div>
  );
};

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
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
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

export default Fornecedores;
