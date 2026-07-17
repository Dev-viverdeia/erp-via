import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type TaxEntry = Tables<"tax_entries">;

export function useTaxEntries(fiscalPeriodId?: string) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["tax-entries", companyId, fiscalPeriodId],
    queryFn: async () => {
      let q = supabase
        .from("tax_entries")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });

      if (fiscalPeriodId) {
        q = q.eq("fiscal_period_id", fiscalPeriodId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as TaxEntry[];
    },
    enabled: !!companyId,
  });
}

export function useCreateTaxEntry() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (entry: Omit<TablesInsert<"tax_entries">, "company_id">) => {
      const { error } = await supabase
        .from("tax_entries")
        .insert({ ...entry, company_id: companyId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax-entries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTaxEntries() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async ({ fiscalPeriodId, taxType }: { fiscalPeriodId: string; taxType: string }) => {
      const { error } = await supabase
        .from("tax_entries")
        .delete()
        .eq("company_id", companyId!)
        .eq("fiscal_period_id", fiscalPeriodId)
        .eq("tax_type", taxType);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax-entries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
