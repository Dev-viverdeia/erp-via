import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type BudgetScenario = Tables<"budget_scenarios">;

export function useBudgetScenarios(year?: number) {
  return useQuery({
    queryKey: ["budget-scenarios", year],
    queryFn: async () => {
      let query = supabase
        .from("budget_scenarios")
        .select("*")
        .order("year", { ascending: false })
        .order("name");
      if (year) query = query.eq("year", year);
      const { data, error } = await query;
      if (error) throw error;
      return data as BudgetScenario[];
    },
  });
}

export function useCreateBudgetScenario() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (scenario: Omit<TablesInsert<"budget_scenarios">, "company_id" | "created_by">) => {
      const { data, error } = await supabase
        .from("budget_scenarios")
        .insert({ ...scenario, company_id: companyId!, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget-scenarios"] }),
  });
}

export function useUpdateBudgetScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"budget_scenarios"> & { id: string }) => {
      const { data, error } = await supabase
        .from("budget_scenarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget-scenarios"] }),
  });
}

export function useDeleteBudgetScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_scenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget-scenarios"] }),
  });
}
