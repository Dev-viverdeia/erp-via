import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useReconcileTransaction } from "@/hooks/useBankTransactions";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  transaction: Tables<"bank_transactions"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReconcileDialog({ transaction, open, onOpenChange }: Props) {
  const { data: companyId } = useCompanyId();
  const reconcile = useReconcileTransaction();

  const { data: installments = [] } = useQuery({
    queryKey: ["reconcile-candidates-installments", transaction?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("revenue_installments")
        .select("id, amount, paid_amount, paid_date, installment_number, revenue_id")
        .eq("status", "paid")
        .not("paid_date", "is", null);
      return data || [];
    },
    enabled: open && transaction?.type === "credit",
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["reconcile-candidates-expenses", transaction?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("id, description, amount, paid_date")
        .eq("company_id", companyId!)
        .eq("status", "paid")
        .is("deleted_at", null)
        .not("paid_date", "is", null);
      return data || [];
    },
    enabled: open && transaction?.type === "debit" && !!companyId,
  });

  if (!transaction) return null;

  const txAmount = Number(transaction.amount);
  const tolerance = txAmount * 0.05;

  const filteredInstallments = installments
    .filter((inst) => Math.abs(Number(inst.paid_amount || inst.amount) - txAmount) <= tolerance)
    .sort((a, b) => {
      const exactA = Number(a.paid_amount || a.amount) === txAmount ? 0 : 1;
      const exactB = Number(b.paid_amount || b.amount) === txAmount ? 0 : 1;
      if (exactA !== exactB) return exactA - exactB;
      const diffA = Math.abs(new Date(a.paid_date!).getTime() - new Date(transaction.date).getTime());
      const diffB = Math.abs(new Date(b.paid_date!).getTime() - new Date(transaction.date).getTime());
      return diffA - diffB;
    });

  const filteredExpenses = expenses
    .filter((exp) => Math.abs(Number(exp.amount) - txAmount) <= tolerance)
    .sort((a, b) => {
      const exactA = Number(a.amount) === txAmount ? 0 : 1;
      const exactB = Number(b.amount) === txAmount ? 0 : 1;
      if (exactA !== exactB) return exactA - exactB;
      const diffA = Math.abs(new Date(a.paid_date!).getTime() - new Date(transaction.date).getTime());
      const diffB = Math.abs(new Date(b.paid_date!).getTime() - new Date(transaction.date).getTime());
      return diffA - diffB;
    });

  const handleSelect = (type: "revenue_installment" | "expense", matchId: string) => {
    reconcile.mutate(
      { id: transaction.id, type, matchId },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Conciliar Transação</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-border p-3 bg-muted/30 text-sm space-y-1">
          <p><span className="font-medium">Data:</span> {formatDate(transaction.date)}</p>
          <p><span className="font-medium">Descrição:</span> {transaction.description}</p>
          <p><span className="font-medium">Valor:</span> {formatCurrency(txAmount)}</p>
          <p><span className="font-medium">Tipo:</span> {transaction.type === "credit" ? "Crédito" : "Débito"}</p>
        </div>

        <Tabs defaultValue={transaction.type === "credit" ? "installments" : "expenses"}>
          <TabsList>
            <TabsTrigger value="installments">Parcelas de Receita</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="installments" className="max-h-64 overflow-auto">
            {filteredInstallments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum candidato encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Pgto</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments.map((inst) => {
                    const exact = Number(inst.paid_amount || inst.amount) === txAmount;
                    return (
                      <TableRow
                        key={inst.id}
                        className={cn("cursor-pointer hover:bg-accent", exact && "bg-status-success-light/10")}
                        onClick={() => handleSelect("revenue_installment", inst.id)}
                      >
                        <TableCell>{formatDate(inst.paid_date!)}</TableCell>
                        <TableCell>#{inst.installment_number}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(inst.paid_amount || inst.amount))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent value="expenses" className="max-h-64 overflow-auto">
            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum candidato encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Pgto</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((exp) => {
                    const exact = Number(exp.amount) === txAmount;
                    return (
                      <TableRow
                        key={exp.id}
                        className={cn("cursor-pointer hover:bg-accent", exact && "bg-status-success-light/10")}
                        onClick={() => handleSelect("expense", exp.id)}
                      >
                        <TableCell>{formatDate(exp.paid_date!)}</TableCell>
                        <TableCell className="max-w-xs truncate">{exp.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(exp.amount))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
