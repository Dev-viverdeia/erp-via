import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";

export interface BalanceteRow {
  account_id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  is_analytical: boolean;
  total_debit: number;
  total_credit: number;
  balance: number;
}

export function useBalancete(startDate?: string, endDate?: string) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["balancete", companyId, startDate, endDate],
    queryFn: async () => {
      // Get all accounts
      const { data: accounts, error: accErr } = await supabase
        .from("chart_of_accounts")
        .select("id, code, name, type, nature, is_analytical")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("code");
      if (accErr) throw accErr;

      // Get all lines in period
      let query = supabase
        .from("journal_entry_lines")
        .select("account_id, debit_amount, credit_amount, journal_entries!inner(entry_date, company_id)")
        .eq("journal_entries.company_id", companyId!);

      if (startDate) query = query.gte("journal_entries.entry_date", startDate);
      if (endDate) query = query.lte("journal_entries.entry_date", endDate);

      const { data: lines, error: linesErr } = await query;
      if (linesErr) throw linesErr;

      // Aggregate by account
      const agg = new Map<string, { debit: number; credit: number }>();
      for (const line of lines || []) {
        const cur = agg.get(line.account_id) || { debit: 0, credit: 0 };
        cur.debit += Number(line.debit_amount);
        cur.credit += Number(line.credit_amount);
        agg.set(line.account_id, cur);
      }

      const rows: BalanceteRow[] = (accounts || [])
        .filter((a) => a.is_analytical)
        .map((a) => {
          const totals = agg.get(a.id) || { debit: 0, credit: 0 };
          const balance =
            a.nature === "debit"
              ? totals.debit - totals.credit
              : totals.credit - totals.debit;
          return {
            account_id: a.id,
            code: a.code,
            name: a.name,
            type: a.type,
            nature: a.nature,
            is_analytical: a.is_analytical,
            total_debit: totals.debit,
            total_credit: totals.credit,
            balance,
          };
        });

      return rows;
    },
    enabled: !!companyId && !!startDate && !!endDate,
  });
}

export interface RazaoRow {
  id: string;
  entry_date: string;
  entry_description: string;
  line_description: string | null;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

export function useRazao(accountId?: string, startDate?: string, endDate?: string) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["razao", companyId, accountId, startDate, endDate],
    queryFn: async () => {
      // Get account nature
      const { data: account } = await supabase
        .from("chart_of_accounts")
        .select("nature")
        .eq("id", accountId!)
        .single();

      let query = supabase
        .from("journal_entry_lines")
        .select("id, debit_amount, credit_amount, description, journal_entries!inner(entry_date, description, company_id)")
        .eq("account_id", accountId!)
        .eq("journal_entries.company_id", companyId!);

      if (startDate) query = query.gte("journal_entries.entry_date", startDate);
      if (endDate) query = query.lte("journal_entries.entry_date", endDate);
      query = query.order("journal_entries(entry_date)", { ascending: true });

      const { data: lines, error } = await query;
      if (error) throw error;

      const nature = account?.nature || "debit";
      let running = 0;
      const rows: RazaoRow[] = (lines || []).map((l: any) => {
        const d = Number(l.debit_amount);
        const c = Number(l.credit_amount);
        running += nature === "debit" ? d - c : c - d;
        return {
          id: l.id,
          entry_date: l.journal_entries.entry_date,
          entry_description: l.journal_entries.description,
          line_description: l.description,
          debit_amount: d,
          credit_amount: c,
          running_balance: running,
        };
      });

      return rows;
    },
    enabled: !!companyId && !!accountId && !!startDate && !!endDate,
  });
}
