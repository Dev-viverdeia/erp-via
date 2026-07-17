import { useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign,
  FileText, Receipt, CreditCard, Package, Hash, Calendar, Link2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaleDetails } from "@/hooks/useSaleDetails";
import { useUpdateSale } from "@/hooks/useSales";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; status: "info" | "success" | "neutral" | "error" }> = {
  active: { label: "Ativa", status: "info" },
  completed: { label: "Concluida", status: "success" },
  cancelled: { label: "Cancelada", status: "neutral" },
  refunded: { label: "Reembolsada", status: "error" },
};

const installmentStatusMap: Record<string, { label: string; status: "info" | "success" | "error" | "neutral" | "warning" }> = {
  provisioned: { label: "Provisionado", status: "info" },
  pending: { label: "Pendente", status: "warning" },
  paid: { label: "Pago", status: "success" },
  overdue: { label: "Vencido", status: "error" },
  cancelled: { label: "Cancelado", status: "neutral" },
};

const expenseStatusMap: Record<string, { label: string; status: "info" | "success" | "error" | "neutral" | "warning" }> = {
  pending: { label: "Pendente", status: "warning" },
  paid: { label: "Pago", status: "success" },
  overdue: { label: "Vencido", status: "error" },
  cancelled: { label: "Cancelado", status: "neutral" },
};

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartao",
  recurring: "Recorrente",
  boleto: "Boleto",
  bank_transfer: "Transferencia",
};

const VendaProfile = () => {
  const { id } = useParams<{ id: string }>();
  const {
    sale, expenses, installments,
    totalReceivable, totalFees, netAmount, isLoading,
  } = useSaleDetails(id);
  const updateSale = useUpdateSale();

  const [nfDialogOpen, setNfDialogOpen] = useState(false);
  const [nfNumber, setNfNumber] = useState("");

  const handleMarkNfIssued = () => {
    if (!sale) return;
    updateSale.mutate(
      {
        id: sale.id,
        nf_issued: true,
        nf_issued_at: new Date().toISOString(),
        nf_number: nfNumber || null,
      },
      {
        onSuccess: () => {
          toast.success("Nota fiscal marcada como emitida");
          setNfDialogOpen(false);
          setNfNumber("");
        },
        onError: () => {
          toast.error("Erro ao atualizar nota fiscal");
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-8 md:p-10">
          <Skeleton className="h-5 w-40 mb-6" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="flex gap-2 mb-8">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[20px]" />
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error / not found state
  if (!sale) {
    return (
      <div className="glass-panel p-16 text-center">
        <p className="text-muted-foreground text-sm">Venda nao encontrada.</p>
        <NavLink
          to="/vendas"
          className="inline-flex items-center gap-2 text-base text-accent hover:text-foreground transition-colors mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Vendas
        </NavLink>
      </div>
    );
  }

  const saleStatus = statusMap[sale.status] ?? statusMap.active;

  return (
    <div className="space-y-8">
      {/* ===== HERO ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <NavLink
            to="/vendas"
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Vendas
          </NavLink>

          {/* Title + subtitle */}
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
            {sale.product_name || sale.description || "Venda"}
          </h1>
          <p className="text-base text-muted-foreground mb-4">
            {sale.partners?.name ? `${sale.partners.name} \u2022 ` : ""}
            {formatDate(sale.sale_date)}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={saleStatus.status} variant="lighter">
              {saleStatus.label}
            </StatusBadge>
            <Badge variant="secondary" className="text-xs rounded-full px-2.5">
              {paymentLabels[sale.payment_method ?? ""] ?? sale.payment_method ?? "\u2014"}
            </Badge>
            <NfStatusBadge sale={sale} />
          </div>
        </div>
      </section>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={TrendingUp}
          label="Receita Bruta"
          value={totalReceivable}
          color="text-status-success"
        />
        <SummaryCard
          icon={TrendingDown}
          label="Taxas Gateway"
          value={totalFees}
          color="text-destructive"
        />
        <SummaryCard
          icon={DollarSign}
          label="Receita Liquida"
          value={netAmount}
          color="text-accent"
        />
      </div>

      {/* ===== TABS ===== */}
      <Tabs defaultValue="recebiveis" className="space-y-6">
        <TabsList className="rounded-full">
          <TabsTrigger value="recebiveis" className="rounded-full text-base cursor-pointer">
            <Receipt className="h-4 w-4 mr-2" />
            Recebiveis
          </TabsTrigger>
          <TabsTrigger value="despesas" className="rounded-full text-base cursor-pointer">
            <CreditCard className="h-4 w-4 mr-2" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="detalhes" className="rounded-full text-base cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            Detalhes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Recebiveis */}
        <TabsContent value="recebiveis">
          <section className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Parcela</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Vencimento</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Data Pgto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhum recebivel vinculado a esta venda
                    </TableCell>
                  </TableRow>
                ) : (
                  installments.map((inst) => {
                    const st = installmentStatusMap[inst.status] ?? installmentStatusMap.provisioned;
                    const isOverdue = inst.status === "overdue";
                    return (
                      <TableRow
                        key={inst.id}
                        className={`border-b border-border transition-colors ${
                          isOverdue ? "bg-status-error-lighter/30 hover:bg-status-error-lighter/50" : "hover:bg-muted/30"
                        }`}
                      >
                        <TableCell className="px-6 py-4">
                          <span className="text-md font-semibold text-foreground">
                            Parcela {inst.installment_number}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={`text-base ${isOverdue ? "text-status-error font-medium" : "text-muted-foreground"}`}>
                            {formatDate(inst.due_date)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-md font-bold tabular-nums text-foreground">
                            {formatCurrency(inst.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={st.status} variant="lighter">{st.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-base text-muted-foreground">
                            {inst.paid_date ? formatDate(inst.paid_date) : "\u2014"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {installments.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{installments.length} parcela(s)</span>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Tab: Despesas */}
        <TabsContent value="despesas">
          <section className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Descricao</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Fornecedor</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Vencimento</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhuma despesa vinculada a esta venda
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((exp) => {
                    const st = expenseStatusMap[exp.status] ?? expenseStatusMap.pending;
                    return (
                      <TableRow
                        key={exp.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-6 py-4">
                          <p className="text-md font-semibold text-foreground">{exp.description}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-base text-muted-foreground">
                            {(exp.partners as { name: string } | null)?.name ?? "\u2014"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-md font-bold tabular-nums text-foreground">
                            {formatCurrency(exp.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-base text-muted-foreground">
                            {formatDate(exp.due_date)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={st.status} variant="lighter">{st.label}</StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {expenses.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{expenses.length} despesa(s)</span>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Tab: Detalhes */}
        <TabsContent value="detalhes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados da Venda */}
            <div className="glass-card p-6 rounded-[20px]">
              <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Dados da Venda
              </h3>
              <div className="space-y-3">
                <DetailItem icon={FileText} label="Descricao" value={sale.description} />
                <DetailItem icon={Package} label="Produto" value={sale.product_name} />
                <DetailItem
                  icon={CreditCard}
                  label="Metodo de Pagamento"
                  value={paymentLabels[sale.payment_method ?? ""] ?? sale.payment_method}
                />
                <DetailItem
                  icon={Hash}
                  label="Parcelas"
                  value={`${sale.installments_count}x`}
                />
                <DetailItem icon={Link2} label="Ref. Gateway" value={sale.gateway_ref} />
              </div>
            </div>

            {/* Nota Fiscal */}
            <div className="glass-card p-6 rounded-[20px]">
              <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Nota Fiscal
              </h3>
              <div className="space-y-3">
                <DetailItem
                  icon={FileText}
                  label="Requer NF"
                  value={sale.requires_nf ? "Sim" : "Nao"}
                />
                <DetailItem
                  icon={FileText}
                  label="NF Emitida"
                  value={sale.nf_issued ? "Sim" : "Nao"}
                />
                <DetailItem icon={Hash} label="Numero NF" value={sale.nf_number} />
                <DetailItem
                  icon={Calendar}
                  label="Data Emissao"
                  value={sale.nf_issued_at ? formatDate(sale.nf_issued_at) : null}
                />
              </div>
              {sale.requires_nf && !sale.nf_issued && (
                <Button
                  onClick={() => setNfDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full text-base cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Marcar como Emitida
                </Button>
              )}
            </div>

            {/* Gateway */}
            {sale.gateway_config_id && (
              <div className="glass-card p-6 rounded-[20px]">
                <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                  Gateway
                </h3>
                <div className="space-y-3">
                  <DetailItem icon={Link2} label="Config ID" value={sale.gateway_config_id} />
                  <DetailItem icon={Hash} label="Transaction ID" value={sale.gateway_transaction_id} />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== NF DIALOG ===== */}
      <Dialog open={nfDialogOpen} onOpenChange={setNfDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar NF como Emitida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nf-number">Numero da Nota Fiscal (opcional)</Label>
              <Input
                id="nf-number"
                placeholder="Ex: 001234"
                value={nfNumber}
                onChange={(e) => setNfNumber(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNfDialogOpen(false)}
                className="rounded-full cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleMarkNfIssued}
                disabled={updateSale.isPending}
                className="rounded-full cursor-pointer"
              >
                {updateSale.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---- NF Status Badge ---- */
function NfStatusBadge({ sale }: { sale: { nf_issued: boolean; requires_nf: boolean } }) {
  if (sale.nf_issued) {
    return <StatusBadge status="success" variant="lighter">NF Emitida</StatusBadge>;
  }
  if (sale.requires_nf) {
    return <StatusBadge status="warning" variant="lighter">NF Pendente</StatusBadge>;
  }
  return <StatusBadge status="neutral" variant="lighter">NF N/A</StatusBadge>;
}

/* ---- Summary Card ---- */
function SummaryCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="glass-card p-6 rounded-[20px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
          <Icon className={`h-[18px] w-[18px] ${color}`} />
        </div>
        <div className="min-w-0">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
            {label}
          </span>
          <span className={`text-xl font-bold tracking-tight ${color}`}>
            {formatCurrency(value)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Detail Item ---- */
function DetailItem({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground block">{label}</span>
        <span className="text-base text-foreground truncate block">
          {value || "\u2014"}
        </span>
      </div>
    </div>
  );
}

export default VendaProfile;
