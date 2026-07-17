import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Account = Tables<"chart_of_accounts">;

export function useChartOfAccounts() {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["chart-of-accounts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!companyId,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (account: Omit<TablesInsert<"chart_of_accounts">, "company_id">) => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert({ ...account, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast.success("Conta criada com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; is_active?: boolean }) => {
      const { error } = await supabase.from("chart_of_accounts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast.success("Conta atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSeedChartOfAccounts() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("fn_seed_chart_of_accounts", {
        p_company_id: companyId!,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast.success("Plano de contas gerado com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
