import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type WithholdingTax = Tables<"withholding_taxes"> & {
  expenses?: { partner_id: string | null; paid_date: string | null; description: string; partners?: { name: string } | null } | null;
};

export function useWithholdingTaxes(startDate?: string, endDate?: string) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["withholding-taxes", companyId, startDate, endDate],
    queryFn: async () => {
      let q = supabase
        .from("withholding_taxes")
        .select("*, expenses(partner_id, paid_date, description, partners(name))")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });

      if (startDate && endDate) {
        // Filter by expense paid_date range via the join
        // We'll filter client-side since nested filters are limited
      }

      const { data, error } = await q;
      if (error) throw error;

      let result = data as WithholdingTax[];

      if (startDate && endDate) {
        result = result.filter((wt) => {
          const pd = wt.expenses?.paid_date;
          return pd && pd >= startDate && pd <= endDate;
        });
      }

      return result;
    },
    enabled: !!companyId,
  });
}

export function useCreateWithholdingTax() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (entry: Omit<TablesInsert<"withholding_taxes">, "company_id">) => {
      const { error } = await supabase
        .from("withholding_taxes")
        .insert({ ...entry, company_id: companyId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withholding-taxes"] });
      toast.success("Retenção registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
