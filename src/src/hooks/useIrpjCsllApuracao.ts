import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { IRPJ_RATE, IRPJ_ADICIONAL_RATE, IRPJ_ADICIONAL_LIMITE, CSLL_RATE } from "@/lib/fiscal-constants";
import { toast } from "sonner";

export interface LalurAdjustment {
  id: string;
  description: string;
  amount: number;
  type: "addition" | "exclusion";
}

export interface IrpjCsllResult {
  receita: number;
  despesas: number;
  lucroContabil: number;
  adicoes: number;
  exclusoes: number;
  baseCalculo: number;
  irpjNormal: number;
  irpjAdicional: number;
  irpjTotal: number;
  csll: number;
  quarterStartDate: string;
  quarterEndDate: string;
}

function getQuarterDates(quarter: number, year: number) {
  const startMonth = (quarter - 1) * 3;
  const start = `${year}-${String(startMonth + 1).padStart(2, "0")}-01`;
  const endMonth = startMonth + 3;
  const endDate = new Date(year, endMonth, 0);
  const end = endDate.toISOString().split("T")[0];
  return { start, end };
}

export function useIrpjCsllApuracao(quarter: number, year: number, adjustments: LalurAdjustment[]) {
  const { data: companyId } = useCompanyId();
  const { start, end } = getQuarterDates(quarter, year);

  return useQuery({
    queryKey: ["irpj-csll-apuracao", companyId, quarter, year, adjustments],
    queryFn: async (): Promise<IrpjCsllResult> => {
      // Revenue: paid installments in the quarter
      const { data: installments, error: iErr } = await supabase
        .from("revenue_installments")
        .select("paid_amount, revenues!inner(company_id, deleted_at)")
        .eq("status", "paid")
        .gte("paid_date", start)
        .lte("paid_date", end);

      if (iErr) throw iErr;

      const filtered = (installments || []).filter(
        (i: any) => i.revenues?.company_id === companyId && !i.revenues?.deleted_at
      );
      const receita = filtered.reduce((s, i) => s + Number(i.paid_amount || 0), 0);

      // Expenses paid in the quarter
      const { data: expenses, error: eErr } = await supabase
        .from("expenses")
        .select("amount")
        .eq("company_id", companyId!)
        .eq("status", "paid")
        .is("deleted_at", null)
        .gte("paid_date", start)
        .lte("paid_date", end);

      if (eErr) throw eErr;

      const despesas = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
      const lucroContabil = receita - despesas;

      const adicoes = adjustments
        .filter((a) => a.type === "addition")
        .reduce((s, a) => s + a.amount, 0);
      const exclusoes = adjustments
        .filter((a) => a.type === "exclusion")
        .reduce((s, a) => s + a.amount, 0);

      const baseCalculo = Math.max(0, lucroContabil + adicoes - exclusoes);

      const irpjNormal = baseCalculo * IRPJ_RATE;
      const irpjAdicional = Math.max(0, baseCalculo - IRPJ_ADICIONAL_LIMITE) * IRPJ_ADICIONAL_RATE;
      const irpjTotal = irpjNormal + irpjAdicional;
      const csll = baseCalculo * CSLL_RATE;

      return {
        receita,
        despesas,
        lucroContabil,
        adicoes,
        exclusoes,
        baseCalculo,
        irpjNormal,
        irpjAdicional,
        irpjTotal,
        csll,
        quarterStartDate: start,
        quarterEndDate: end,
      };
    },
    enabled: !!companyId,
  });
}

export function useExecuteIrpjCsllApuracao() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async ({
      quarter,
      year,
      result,
    }: {
      quarter: number;
      year: number;
      result: IrpjCsllResult;
    }) => {
      const refId = `Q${quarter}-${year}`;

      // Delete previous IRPJ/CSLL entries for this quarter
      for (const taxType of ["irpj", "csll"]) {
        const { data: existing } = await supabase
          .from("tax_entries")
          .select("id")
          .eq("company_id", companyId!)
          .eq("tax_type", taxType)
          .eq("reference_type", "trimestre")
          .eq("reference_id", refId);

        if (existing && existing.length > 0) {
          await supabase
            .from("tax_entries")
            .delete()
            .eq("company_id", companyId!)
            .eq("tax_type", taxType)
            .eq("reference_type", "trimestre")
            .eq("reference_id", refId);
        }
      }

      const entries = [
        {
          company_id: companyId!,
          tax_type: "irpj",
          entry_type: "debit",
          base_amount: result.baseCalculo,
          rate: IRPJ_RATE * 100,
          tax_amount: result.irpjTotal,
          reference_type: "trimestre",
          reference_id: refId,
        },
        {
          company_id: companyId!,
          tax_type: "csll",
          entry_type: "debit",
          base_amount: result.baseCalculo,
          rate: CSLL_RATE * 100,
          tax_amount: result.csll,
          reference_type: "trimestre",
          reference_id: refId,
        },
      ];

      const { error } = await supabase.from("tax_entries").insert(entries);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax-entries"] });
      toast.success("Apuração IRPJ/CSLL salva com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
