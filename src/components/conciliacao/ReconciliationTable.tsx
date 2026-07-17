import { useState } from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUnreconcileTransaction } from "@/hooks/useBankTransactions";
import { formatCurrency, formatDate } from "@/lib/format";
import { ReconcileDialog } from "./ReconcileDialog";
import { Link2, Unlink } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  transactions: Tables<"bank_transactions">[];
  isLoading: boolean;
}

export function ReconciliationTable({ transactions, isLoading }: Props) {
  const [selectedTx, setSelectedTx] = useState<Tables<"bank_transactions"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const unreconcile = useUnreconcileTransaction();

  const columns: Column<Tables<"bank_transactions">>[] = [
    { header: "Data", cell: (row) => formatDate(row.date), className: "w-28" },
    { header: "Descrição", cell: (row) => <span className="truncate max-w-xs block">{row.description || "—"}</span> },
    {
      header: "Valor",
      cell: (row) => (
        <span className={row.type === "credit" ? "text-status-success" : "text-destructive"}>
          {row.type === "debit" ? "- " : ""}{formatCurrency(Number(row.amount))}
        </span>
      ),
      className: "text-right w-32",
    },
    {
      header: "Tipo",
      cell: (row) => (
        <StatusBadge status={row.type === "credit" ? "success" : "error"}>
          {row.type === "credit" ? "Crédito" : "Débito"}
        </StatusBadge>
      ),
      className: "w-24",
    },
    {
      header: "Status",
      cell: (row) =>
        row.reconciled ? (
          <StatusBadge status="success">
            Conciliada ({row.reconciled_with_type === "revenue_installment" ? "Receita" : "Despesa"})
          </StatusBadge>
        ) : (
          <StatusBadge status="warning">Pendente</StatusBadge>
        ),
      className: "w-40",
    },
    {
      header: "Ações",
      cell: (row) =>
        row.reconciled ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); unreconcile.mutate(row.id); }}
          >
            <Unlink className="h-4 w-4 mr-1" /> Desfazer
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setSelectedTx(row); setDialogOpen(true); }}
          >
            <Link2 className="h-4 w-4 mr-1" /> Conciliar
          </Button>
        ),
      className: "w-32",
    },
  ];

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Carregando transações...</div>;
  }

  return (
    <>
      <DataTable columns={columns} data={transactions} emptyMessage="Nenhuma transação encontrada." />
      <ReconcileDialog transaction={selectedTx} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
