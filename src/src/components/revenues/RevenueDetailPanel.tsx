import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRevenueInstallments, type RevenueInstallment } from "@/hooks/useRevenueInstallments";
import { InstallmentPayDialog } from "./InstallmentPayDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Revenue } from "@/hooks/useRevenues";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";

const statusMap: Record<string, { label: string; status: "info" | "success" | "error" | "neutral" }> = {
  provisioned: { label: "Provisionado", status: "info" },
  paid: { label: "Pago", status: "success" },
  overdue: { label: "Atrasado", status: "error" },
  cancelled: { label: "Cancelado", status: "neutral" },
};

const paymentTypeMap: Record<string, string> = {
  pix: "Pix",
  card: "Cartão à Vista",
  recurring: "Recorrente (12x)",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue: Revenue | null;
}

export function RevenueDetailPanel({ open, onOpenChange, revenue }: Props) {
  const { data: installments, isLoading } = useRevenueInstallments(revenue?.id);
  const [payInstallment, setPayInstallment] = useState<RevenueInstallment | null>(null);

  if (!revenue) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Receita</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Revenue info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente</span>
                <p className="font-medium">{revenue.partners?.name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total</span>
                <p className="font-medium">{formatCurrency(revenue.total_amount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo</span>
                <p className="font-medium">{paymentTypeMap[revenue.payment_type] || revenue.payment_type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Gateway</span>
                <p className="font-medium">{revenue.gateway || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data Contratação</span>
                <p className="font-medium">{formatDate(revenue.contracted_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ref. Gateway</span>
                <p className="font-medium">{revenue.gateway_ref || "—"}</p>
              </div>
            </div>

            {/* Installments table */}
            <div>
              <h3 className="text-sm font-semibold font-heading mb-3">Parcelas ({installments?.length || 0})</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Pgto</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installments?.map((inst) => {
                        const s = statusMap[inst.status] || statusMap.provisioned;
                        return (
                          <TableRow key={inst.id}>
                            <TableCell>{inst.installment_number}</TableCell>
                            <TableCell>{formatCurrency(inst.amount)}</TableCell>
                            <TableCell>{formatDate(inst.due_date)}</TableCell>
                            <TableCell>
                              <StatusBadge status={s.status} variant="light">{s.label}</StatusBadge>
                            </TableCell>
                            <TableCell>{inst.paid_date ? formatDate(inst.paid_date) : "—"}</TableCell>
                            <TableCell>
                              {(inst.status === "provisioned" || inst.status === "overdue") && (
                                <Button size="sm" variant="outline" onClick={() => setPayInstallment(inst)}>
                                  <DollarSign className="h-3.5 w-3.5 mr-1" /> Baixa
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {revenue.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Notas</span>
                <p className="text-sm mt-1">{revenue.notes}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <InstallmentPayDialog
        open={!!payInstallment}
        onOpenChange={(open) => !open && setPayInstallment(null)}
        installment={payInstallment}
      />
    </>
  );
}
