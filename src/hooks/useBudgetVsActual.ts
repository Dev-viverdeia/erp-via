import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BudgetVsActualRow = {
  account_id: string;
  code: string;
  name: string;
  type: string;
  month: number;
  budget: number;
  actual: number;
  variance: number;
  variance_pct: number;
};

export function useBudgetVsActual(scenarioId?: string, year?: number) {
  return useQuery({
    queryKey: ["budget-vs-actual", scenarioId, year],
    queryFn: async () => {
      // 1. Get budget lines
      const { data: budgetLines, error: blError } = await supabase
        .from("budget_lines")
        .select("account_id, month, amount")
        .eq("scenario_id", scenarioId!);
      if (blError) throw blError;

      // 2. Get actual amounts from journal entries
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const { data: actuals, error: actError } = await supabase
        .from("journal_entry_lines")
        .select("account_id, debit_amount, credit_amount, journal_entries!inner(entry_date)")
        .gte("journal_entries.entry_date", startDate)
        .lte("journal_entries.entry_date", endDate);
      if (actError) throw actError;

      // 3. Get accounts info
      const { data: accounts, error: accError } = await supabase
        .from("chart_of_accounts")
        .select("id, code, name, type, nature")
        .eq("is_analytical", true)
        .eq("is_active", true)
        .order("code");
      if (accError) throw accError;

      // 4. Aggregate actuals by account + month
      const actualMap = new Map<string, number>();
      for (const line of actuals ?? []) {
        const entryDate = (line.journal_entries as { entry_date: string }).entry_date;
        const month = new Date(entryDate).getMonth() + 1;
        const account = accounts?.find((a) => a.id === line.account_id);
        if (!account) continue;
        const key = `${line.account_id}-${month}`;
        const amount = account.type === "revenue" || account.type === "liability" || account.type === "equity"
          ? (line.credit_amount ?? 0) - (line.debit_amount ?? 0)
          : (line.debit_amount ?? 0) - (line.credit_amount ?? 0);
        actualMap.set(key, (actualMap.get(key) ?? 0) + amount);
      }

      // 5. Build budget map
      const budgetMap = new Map<string, number>();
      for (const bl of budgetLines ?? []) {
        const key = `${bl.account_id}-${bl.month}`;
        budgetMap.set(key, bl.amount);
      }

      // 6. Combine into rows
      const rows: BudgetVsActualRow[] = [];
      const accountIds = new Set<string>();
      for (const bl of budgetLines ?? []) accountIds.add(bl.account_id);
      for (const key of actualMap.keys()) {
        // Keys are "uuid-month", extract UUID (36 chars)
        accountIds.add(key.substring(0, 36));
      }

      for (const account of accounts ?? []) {
        if (!accountIds.has(account.id)) continue;
        for (let m = 1; m <= 12; m++) {
          const key = `${account.id}-${m}`;
          const budget = budgetMap.get(key) ?? 0;
          const actual = actualMap.get(key) ?? 0;
          if (budget === 0 && actual === 0) continue;
          const variance = actual - budget;
          const variance_pct = budget !== 0 ? (variance / Math.abs(budget)) * 100 : actual !== 0 ? 100 : 0;
          rows.push({
            account_id: account.id,
            code: account.code,
            name: account.name,
            type: account.type,
            month: m,
            budget,
            actual,
            variance,
            variance_pct,
          });
        }
      }

      return rows;
    },
    enabled: !!scenarioId && !!year,
  });
}
