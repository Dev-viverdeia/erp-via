import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";

export interface BalancoGroup {
  label: string;
  code: string;
  rows: BalancoRow[];
  total: number;
}

export interface BalancoRow {
  code: string;
  name: string;
  balance: number;
  is_analytical: boolean;
}

export interface BalancoData {
  ativoCirculante: BalancoGroup;
  ativoNaoCirculante: BalancoGroup;
  totalAtivo: number;
  passivoCirculante: BalancoGroup;
  patrimonioLiquido: BalancoGroup;
  totalPassivoPL: number;
  isBalanced: boolean;
}

export function useBalancoPatrimonial(startDate?: string, endDate?: string) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["balanco-patrimonial", companyId, startDate, endDate],
    queryFn: async (): Promise<BalancoData> => {
      // Get ALL accounts (including synthetic) for hierarchy
      const { data: accounts, error: accErr } = await supabase
        .from("chart_of_accounts")
        .select("id, code, name, type, nature, is_analytical, parent_id")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("code");
      if (accErr) throw accErr;

      // Get journal entry lines in period
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

      // Calculate balance for each analytical account
      const balances = new Map<string, number>();
      for (const acc of accounts || []) {
        if (acc.is_analytical) {
          const totals = agg.get(acc.id) || { debit: 0, credit: 0 };
          const balance = acc.nature === "debit"
            ? totals.debit - totals.credit
            : totals.credit - totals.debit;
          balances.set(acc.code, balance);
        }
      }

      // Group accounts by prefix
      const groupAccounts = (prefix: string): BalancoRow[] => {
        return (accounts || [])
          .filter(a => a.code.startsWith(prefix) && a.is_analytical)
          .map(a => ({
            code: a.code,
            name: a.name,
            balance: balances.get(a.code) || 0,
            is_analytical: a.is_analytical,
          }));
      };

      const sumGroup = (rows: BalancoRow[]) => rows.reduce((s, r) => s + r.balance, 0);

      const acRows = groupAccounts("1.1.");
      const ancRows = groupAccounts("1.2.");
      const pcRows = groupAccounts("2.1.");
      const plRows = groupAccounts("3.");

      const ativoCirculante: BalancoGroup = { label: "Ativo Circulante", code: "1.1", rows: acRows, total: sumGroup(acRows) };
      const ativoNaoCirculante: BalancoGroup = { label: "Ativo Não Circulante", code: "1.2", rows: ancRows, total: sumGroup(ancRows) };
      const passivoCirculante: BalancoGroup = { label: "Passivo Circulante", code: "2.1", rows: pcRows, total: sumGroup(pcRows) };
      const patrimonioLiquido: BalancoGroup = { label: "Patrimônio Líquido", code: "3", rows: plRows, total: sumGroup(plRows) };

      const totalAtivo = ativoCirculante.total + ativoNaoCirculante.total;
      const totalPassivoPL = passivoCirculante.total + patrimonioLiquido.total;

      return {
        ativoCirculante,
        ativoNaoCirculante,
        totalAtivo,
        passivoCirculante,
        patrimonioLiquido,
        totalPassivoPL,
        isBalanced: Math.abs(totalAtivo - totalPassivoPL) < 0.01,
      };
    },
    enabled: !!companyId && !!startDate && !!endDate,
  });
}
