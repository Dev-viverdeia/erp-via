import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { PIS_RATE, COFINS_RATE } from "@/lib/fiscal-constants";
import { toast } from "sonner";
import type { FiscalPeriod } from "./useFiscalPeriods";

export interface PisCofinsResult {
  revenueBase: number;
  expenseBase: number;
  pisDebito: number;
  pisCredito: number;
  pisSaldo: number;
  cofinsDebito: number;
  cofinsCredito: number;
  cofinsSaldo: number;
  revenueLines: { id: string; paid_amount: number; paid_date: string; revenue_id: string }[];
  expenseLines: { id: string; amount: number; paid_date: string; description: string }[];
}

export function usePisCofinsApuracao(period?: FiscalPeriod | null) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["pis-cofins-apuracao", companyId, period?.id],
    queryFn: async (): Promise<PisCofinsResult> => {
      if (!period) throw new Error("Período não selecionado");

      // Fetch paid installments in the period
      const { data: installments, error: iErr } = await supabase
        .from("revenue_installments")
        .select("id, paid_amount, paid_date, revenue_id, revenues!inner(company_id, deleted_at)")
        .eq("status", "paid")
        .gte("paid_date", period.start_date)
        .lte("paid_date", period.end_date);

      if (iErr) throw iErr;

      const filteredInstallments = (installments || []).filter(
        (i: any) => i.revenues?.company_id === companyId && !i.revenues?.deleted_at
      );

      // Fetch eligible expenses
      const { data: expenses, error: eErr } = await supabase
        .from("expenses")
        .select("id, amount, paid_date, description")
        .eq("company_id", companyId!)
        .eq("status", "paid")
        .eq("pis_cofins_credit", true)
        .is("deleted_at", null)
        .gte("paid_date", period.start_date)
        .lte("paid_date", period.end_date);

      if (eErr) throw eErr;

      const revenueBase = filteredInstallments.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
      const expenseBase = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);

      const pisDebito = revenueBase * PIS_RATE;
      const pisCredito = expenseBase * PIS_RATE;
      const cofinsDebito = revenueBase * COFINS_RATE;
      const cofinsCredito = expenseBase * COFINS_RATE;

      return {
        revenueBase,
        expenseBase,
        pisDebito,
        pisCredito,
        pisSaldo: pisDebito - pisCredito,
        cofinsDebito,
        cofinsCredito,
        cofinsSaldo: cofinsDebito - cofinsCredito,
        revenueLines: filteredInstallments.map((i) => ({
          id: i.id,
          paid_amount: Number(i.paid_amount || 0),
          paid_date: i.paid_date!,
          revenue_id: i.revenue_id,
        })),
        expenseLines: (expenses || []).map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          paid_date: e.paid_date!,
          description: e.description,
        })),
      };
    },
    enabled: !!companyId && !!period,
  });
}

export function useExecutePisCofinsApuracao() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async ({
      period,
      result,
    }: {
      period: FiscalPeriod;
      result: PisCofinsResult;
    }) => {
      // Delete previous entries for this period
      for (const taxType of ["pis", "cofins"]) {
        await supabase
          .from("tax_entries")
          .delete()
          .eq("company_id", companyId!)
          .eq("fiscal_period_id", period.id)
          .eq("tax_type", taxType);
      }

      const entries = [
        {
          company_id: companyId!,
          fiscal_period_id: period.id,
          tax_type: "pis",
          entry_type: "debit",
          base_amount: result.revenueBase,
          rate: PIS_RATE * 100,
          tax_amount: result.pisDebito,
          reference_type: "apuracao_mensal",
        },
        {
          company_id: companyId!,
          fiscal_period_id: period.id,
          tax_type: "pis",
          entry_type: "credit",
          base_amount: result.expenseBase,
          rate: PIS_RATE * 100,
          tax_amount: result.pisCredito,
          reference_type: "apuracao_mensal",
        },
        {
          company_id: companyId!,
          fiscal_period_id: period.id,
          tax_type: "cofins",
          entry_type: "debit",
          base_amount: result.revenueBase,
          rate: COFINS_RATE * 100,
          tax_amount: result.cofinsDebito,
          reference_type: "apuracao_mensal",
        },
        {
          company_id: companyId!,
          fiscal_period_id: period.id,
          tax_type: "cofins",
          entry_type: "credit",
          base_amount: result.expenseBase,
          rate: COFINS_RATE * 100,
          tax_amount: result.cofinsCredito,
          reference_type: "apuracao_mensal",
        },
      ];

      const { error } = await supabase.from("tax_entries").insert(entries);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax-entries"] });
      qc.invalidateQueries({ queryKey: ["pis-cofins-apuracao"] });
      toast.success("Apuração PIS/COFINS salva com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
