import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";

export interface CostCenterReportRow {
  id: string;
  name: string;
  code: string | null;
  totalExpenses: number;
  percentage: number;
  count: number;
}

export function useCostCenterReport(startDate: string, endDate: string) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["cost-center-report", companyId, startDate, endDate],
    queryFn: async () => {
      // Fetch paid expenses in the period
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("id, amount, cost_center_id")
        .eq("company_id", companyId!)
        .eq("status", "paid")
        .is("deleted_at", null)
        .gte("paid_date", startDate)
        .lte("paid_date", endDate);

      if (error) throw error;

      // Fetch cost centers
      const { data: costCenters, error: ccError } = await supabase
        .from("cost_centers")
        .select("id, name, code")
        .eq("company_id", companyId!);

      if (ccError) throw ccError;

      const ccMap = new Map(costCenters.map((cc) => [cc.id, cc]));

      // Group by cost_center_id
      const grouped = new Map<string | null, { total: number; count: number }>();
      for (const exp of expenses ?? []) {
        const key = exp.cost_center_id;
        const prev = grouped.get(key) ?? { total: 0, count: 0 };
        grouped.set(key, { total: prev.total + Number(exp.amount), count: prev.count + 1 });
      }

      const grandTotal = Array.from(grouped.values()).reduce((s, v) => s + v.total, 0);

      const rows: CostCenterReportRow[] = [];
      for (const [ccId, agg] of grouped) {
        const cc = ccId ? ccMap.get(ccId) : null;
        rows.push({
          id: ccId ?? "sem-centro",
          name: cc?.name ?? "Sem Centro de Custo",
          code: cc?.code ?? "—",
          totalExpenses: agg.total,
          percentage: grandTotal > 0 ? (agg.total / grandTotal) * 100 : 0,
          count: agg.count,
        });
      }

      rows.sort((a, b) => b.totalExpenses - a.totalExpenses);
      return { rows, grandTotal };
    },
    enabled: !!companyId && !!startDate && !!endDate,
  });
}
