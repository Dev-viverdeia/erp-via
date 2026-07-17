import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useCompanyId } from "./useCompanyId";
import { createRevenueInstallmentJournalEntry } from "./useAutoJournalEntry";

export type RevenueInstallment = Tables<"revenue_installments">;

export function useRevenueInstallments(revenueId?: string) {
  return useQuery({
    queryKey: ["revenue-installments", revenueId],
    enabled: !!revenueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_installments")
        .select("*")
        .eq("revenue_id", revenueId!)
        .order("installment_number");
      if (error) throw error;
      return data as RevenueInstallment[];
    },
  });
}

export function usePayInstallment() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async ({ id, bank_account_id, paid_date, paid_amount, isRecurring }: {
      id: string;
      bank_account_id: string;
      paid_date: string;
      paid_amount: number;
      isRecurring?: boolean;
    }) => {
      const { error } = await supabase
        .from("revenue_installments")
        .update({ status: "paid", paid_date, bank_account_id, paid_amount })
        .eq("id", id);
      if (error) throw error;

      // Auto journal entry
      if (companyId) {
        try {
          await createRevenueInstallmentJournalEntry(companyId, paid_amount, paid_date, id, !!isRecurring);
        } catch (e) {
          console.warn("Auto journal entry failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-installments"] });
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
    },
  });
}
