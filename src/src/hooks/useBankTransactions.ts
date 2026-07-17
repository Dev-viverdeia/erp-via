import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { toast } from "sonner";
import type { ParsedTransaction } from "@/lib/csv-parser";

type ReconciledFilter = "all" | "reconciled" | "pending";

export function useBankTransactions(
  bankAccountId?: string,
  startDate?: string,
  endDate?: string,
  reconciledFilter: ReconciledFilter = "all"
) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["bank-transactions", companyId, bankAccountId, startDate, endDate, reconciledFilter],
    queryFn: async () => {
      let query = supabase
        .from("bank_transactions")
        .select("*")
        .eq("company_id", companyId!)
        .order("date", { ascending: false });

      if (bankAccountId) query = query.eq("bank_account_id", bankAccountId);
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
      if (reconciledFilter === "reconciled") query = query.eq("reconciled", true);
      if (reconciledFilter === "pending") query = query.eq("reconciled", false);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useImportBankTransactions() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async ({ bankAccountId, transactions }: { bankAccountId: string; transactions: ParsedTransaction[] }) => {
      if (!companyId) throw new Error("Company not found");

      // Check existing import_refs for idempotency
      const refs = transactions.map((t) => t.import_ref);
      const { data: existing } = await supabase
        .from("bank_transactions")
        .select("import_ref")
        .eq("bank_account_id", bankAccountId)
        .in("import_ref", refs);

      const existingRefs = new Set((existing || []).map((e) => e.import_ref));
      const newTx = transactions.filter((t) => !existingRefs.has(t.import_ref));

      if (newTx.length === 0) return { inserted: 0, skipped: transactions.length };

      const rows = newTx.map((t) => ({
        company_id: companyId,
        bank_account_id: bankAccountId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        import_ref: t.import_ref,
      }));

      const { error } = await supabase.from("bank_transactions").insert(rows);
      if (error) throw error;

      return { inserted: newTx.length, skipped: transactions.length - newTx.length };
    },
    onSuccess: (result) => {
      toast.success(`${result.inserted} transações importadas, ${result.skipped} ignoradas (duplicatas)`);
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReconcileTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, matchId }: { id: string; type: "revenue_installment" | "expense"; matchId: string }) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update({ reconciled: true, reconciled_with_type: type, reconciled_with_id: matchId })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Transação conciliada");
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUnreconcileTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update({ reconciled: false, reconciled_with_type: null, reconciled_with_id: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conciliação desfeita");
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAutoReconcile() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (bankAccountId: string) => {
      if (!companyId) throw new Error("Company not found");

      // Get unreconciled transactions
      const { data: pending } = await supabase
        .from("bank_transactions")
        .select("*")
        .eq("bank_account_id", bankAccountId)
        .eq("reconciled", false)
        .eq("company_id", companyId);

      if (!pending || pending.length === 0) return 0;

      let matched = 0;

      for (const tx of pending) {
        if (tx.type === "credit") {
          // Match against paid revenue installments
          const { data: installments } = await supabase
            .from("revenue_installments")
            .select("id, paid_amount, paid_date, revenue_id")
            .eq("status", "paid")
            .not("paid_date", "is", null);

          if (installments) {
            // Filter by revenue company_id
            const candidates = installments.filter((inst) => {
              if (Number(inst.paid_amount) !== Number(tx.amount)) return false;
              if (!inst.paid_date) return false;
              const daysDiff = Math.abs(
                (new Date(inst.paid_date).getTime() - new Date(tx.date).getTime()) / 86400000
              );
              return daysDiff <= 3;
            });

            if (candidates.length === 1) {
              await supabase
                .from("bank_transactions")
                .update({ reconciled: true, reconciled_with_type: "revenue_installment", reconciled_with_id: candidates[0].id })
                .eq("id", tx.id);
              matched++;
            }
          }
        } else {
          // Match against paid expenses
          const { data: expenses } = await supabase
            .from("expenses")
            .select("id, amount, paid_date")
            .eq("company_id", companyId)
            .eq("status", "paid")
            .is("deleted_at", null)
            .not("paid_date", "is", null);

          if (expenses) {
            const candidates = expenses.filter((exp) => {
              if (Number(exp.amount) !== Number(tx.amount)) return false;
              if (!exp.paid_date) return false;
              const daysDiff = Math.abs(
                (new Date(exp.paid_date).getTime() - new Date(tx.date).getTime()) / 86400000
              );
              return daysDiff <= 3;
            });

            if (candidates.length === 1) {
              await supabase
                .from("bank_transactions")
                .update({ reconciled: true, reconciled_with_type: "expense", reconciled_with_id: candidates[0].id })
                .eq("id", tx.id);
              matched++;
            }
          }
        }
      }

      return matched;
    },
    onSuccess: (count) => {
      toast.success(`${count} transação(ões) conciliada(s) automaticamente`);
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
