import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type FiscalPeriod = Tables<"fiscal_periods">;

export function useFiscalPeriods() {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["fiscal-periods", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fiscal_periods")
        .select("*")
        .eq("company_id", companyId!)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data as FiscalPeriod[];
    },
    enabled: !!companyId,
  });
}

export function useCreateFiscalPeriod() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];

      const { error } = await supabase.from("fiscal_periods").insert({
        company_id: companyId!,
        year,
        month,
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-periods"] });
      toast.success("Período fiscal criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCloseFiscalPeriod() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (periodId: string) => {
      const { error } = await supabase
        .from("fiscal_periods")
        .update({ status: "closed", closed_by: user?.id, closed_at: new Date().toISOString() })
        .eq("id", periodId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-periods"] });
      toast.success("Período fechado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReopenFiscalPeriod() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (periodId: string) => {
      const { error } = await supabase
        .from("fiscal_periods")
        .update({ status: "open", closed_by: null, closed_at: null })
        .eq("id", periodId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-periods"] });
      toast.success("Período reaberto");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
