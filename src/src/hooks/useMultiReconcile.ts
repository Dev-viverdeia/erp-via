import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SystemEntry } from "./usePendingSystemEntries";

type ReconcileInput = {
  transactionId: string;
  transactionDate: string;
  bankAccountId: string;
  items: SystemEntry[];
};

export function useMultiReconcile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, transactionDate, bankAccountId, items }: ReconcileInput) => {
      // 1. Mark bank transaction as reconciled
      const reconcileType = items.length === 1 ? (items[0].source === "installment" ? "revenue_installment" : "expense") : "multiple";
      const reconcileId = items.length === 1 ? items[0].id : null;

      const { error: txError } = await supabase
        .from("bank_transactions")
        .update({
          reconciled: true,
          reconciled_with_type: reconcileType,
          reconciled_with_id: reconcileId,
        })
        .eq("id", transactionId);
      if (txError) throw txError;

      // 2. Mark each system item as paid
      for (const item of items) {
        if (item.source === "installment") {
          const { error } = await supabase
            .from("revenue_installments")
            .update({
              status: "paid",
              paid_date: transactionDate,
              paid_amount: item.amount,
              bank_account_id: bankAccountId,
            })
            .eq("id", item.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("expenses")
            .update({
              status: "paid",
              paid_date: transactionDate,
              bank_account_id: bankAccountId,
            })
            .eq("id", item.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["pending-system-entries"] });
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["revenue-installments"] });
    },
  });
}
