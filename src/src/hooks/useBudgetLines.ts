import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BudgetLine = Tables<"budget_lines">;

export function useBudgetLines(scenarioId?: string) {
  return useQuery({
    queryKey: ["budget-lines", scenarioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_lines")
        .select("*")
        .eq("scenario_id", scenarioId!)
        .order("month");
      if (error) throw error;
      return data as BudgetLine[];
    },
    enabled: !!scenarioId,
  });
}

export function useUpsertBudgetLines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lines: { scenario_id: string; account_id: string; cost_center_id: string | null; month: number; amount: number }[]) => {
      const { error } = await supabase
        .from("budget_lines")
        .upsert(
          lines.map((l) => ({
            scenario_id: l.scenario_id,
            account_id: l.account_id,
            cost_center_id: l.cost_center_id,
            month: l.month,
            amount: l.amount,
          })),
          { onConflict: "scenario_id,account_id,cost_center_id,month" }
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget-lines"] }),
  });
}
