import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FinancialIndicators = {
  receita: number;
  despesa: number;
  resultado: number;
  margemOperacional: number;
  burnRate: number;
  monthlyData: { month: number; receita: number; despesa: number }[];
};

export function useFinancialIndicators(year: number) {
  return useQuery({
    queryKey: ["financial-indicators", year],
    queryFn: async () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: lines, error } = await supabase
        .from("journal_entry_lines")
        .select("account_id, debit_amount, credit_amount, journal_entries!inner(entry_date), chart_of_accounts!inner(type)")
        .gte("journal_entries.entry_date", startDate)
        .lte("journal_entries.entry_date", endDate);
      if (error) throw error;

      const monthlyData: { month: number; receita: number; despesa: number }[] = [];
      for (let m = 1; m <= 12; m++) {
        monthlyData.push({ month: m, receita: 0, despesa: 0 });
      }

      let totalReceita = 0;
      let totalDespesa = 0;

      for (const line of lines ?? []) {
        const entryDate = (line.journal_entries as { entry_date: string }).entry_date;
        const month = new Date(entryDate).getMonth() + 1;
        const type = (line.chart_of_accounts as { type: string }).type;

        if (type === "revenue") {
          const val = (line.credit_amount ?? 0) - (line.debit_amount ?? 0);
          totalReceita += val;
          const md = monthlyData.find((d) => d.month === month);
          if (md) md.receita += val;
        } else if (type === "expense") {
          const val = (line.debit_amount ?? 0) - (line.credit_amount ?? 0);
          totalDespesa += val;
          const md = monthlyData.find((d) => d.month === month);
          if (md) md.despesa += val;
        }
      }

      const resultado = totalReceita - totalDespesa;
      const margemOperacional = totalReceita > 0 ? (resultado / totalReceita) * 100 : 0;
      const currentMonth = new Date().getMonth() + 1;
      const monthsElapsed = Math.max(1, Math.min(currentMonth, 12));
      const burnRate = totalDespesa / monthsElapsed;

      return {
        receita: totalReceita,
        despesa: totalDespesa,
        resultado,
        margemOperacional,
        burnRate,
        monthlyData,
      } as FinancialIndicators;
    },
  });
}
