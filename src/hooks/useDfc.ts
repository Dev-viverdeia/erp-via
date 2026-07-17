import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";

export interface DfcSection {
  label: string;
  items: { label: string; value: number }[];
  total: number;
}

export interface DfcData {
  method: "direct" | "indirect";
  operacional: DfcSection;
  investimento: DfcSection;
  financiamento: DfcSection;
  variacaoLiquida: number;
  saldoInicial: number;
  saldoFinal: number;
}

export function useDfc(startDate?: string, endDate?: string, method: "direct" | "indirect" = "direct") {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["dfc", companyId, startDate, endDate, method],
    queryFn: async (): Promise<DfcData> => {
      if (method === "direct") {
        return buildDirectDfc(companyId!, startDate!, endDate!);
      } else {
        return buildIndirectDfc(companyId!, startDate!, endDate!);
      }
    },
    enabled: !!companyId && !!startDate && !!endDate,
  });
}

async function buildDirectDfc(companyId: string, startDate: string, endDate: string): Promise<DfcData> {
  // Recebimentos de clientes
  const { data: recebimentos } = await supabase
    .from("revenue_installments")
    .select("paid_amount, revenues!inner(company_id)")
    .eq("revenues.company_id", companyId)
    .eq("status", "paid")
    .gte("paid_date", startDate)
    .lte("paid_date", endDate);

  const totalRecebimentos = (recebimentos || []).reduce((s, r) => s + Number(r.paid_amount || 0), 0);

  // Pagamentos a fornecedores
  const { data: pagamentos } = await supabase
    .from("expenses")
    .select("amount, status, paid_date")
    .eq("company_id", companyId)
    .eq("status", "paid")
    .is("deleted_at", null)
    .gte("paid_date", startDate)
    .lte("paid_date", endDate);

  const totalPagamentos = (pagamentos || []).reduce((s, e) => s + Number(e.amount), 0);

  // Impostos (withholding taxes)
  const { data: impostos } = await supabase
    .from("withholding_taxes")
    .select("withheld_amount, expenses!inner(paid_date, status)")
    .eq("company_id", companyId)
    .eq("expenses.status", "paid")
    .gte("expenses.paid_date", startDate)
    .lte("expenses.paid_date", endDate);

  const totalImpostos = (impostos || []).reduce((s, i) => s + Number(i.withheld_amount), 0);

  const operacional: DfcSection = {
    label: "Atividades Operacionais",
    items: [
      { label: "Recebimentos de clientes", value: totalRecebimentos },
      { label: "Pagamentos a fornecedores", value: -totalPagamentos },
      { label: "Impostos pagos", value: -totalImpostos },
    ],
    total: totalRecebimentos - totalPagamentos - totalImpostos,
  };

  const investimento: DfcSection = {
    label: "Atividades de Investimento",
    items: [],
    total: 0,
  };

  const financiamento: DfcSection = {
    label: "Atividades de Financiamento",
    items: [],
    total: 0,
  };

  // Saldo inicial: sum of bank account balances
  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("initial_balance, current_balance")
    .eq("company_id", companyId)
    .eq("is_active", true);

  const saldoInicial = (bankAccounts || []).reduce((s, b) => s + Number(b.current_balance), 0);
  const variacaoLiquida = operacional.total + investimento.total + financiamento.total;

  return {
    method: "direct",
    operacional,
    investimento,
    financiamento,
    variacaoLiquida,
    saldoInicial,
    saldoFinal: saldoInicial + variacaoLiquida,
  };
}

async function buildIndirectDfc(companyId: string, startDate: string, endDate: string): Promise<DfcData> {
  // Resultado líquido: receitas - despesas no período (contábil)
  const { data: receitasPagas } = await supabase
    .from("revenue_installments")
    .select("paid_amount, revenues!inner(company_id)")
    .eq("revenues.company_id", companyId)
    .eq("status", "paid")
    .gte("paid_date", startDate)
    .lte("paid_date", endDate);

  const totalReceitas = (receitasPagas || []).reduce((s, r) => s + Number(r.paid_amount || 0), 0);

  const { data: despesasPagas } = await supabase
    .from("expenses")
    .select("amount")
    .eq("company_id", companyId)
    .eq("status", "paid")
    .is("deleted_at", null)
    .gte("paid_date", startDate)
    .lte("paid_date", endDate);

  const totalDespesas = (despesasPagas || []).reduce((s, e) => s + Number(e.amount), 0);
  const resultadoLiquido = totalReceitas - totalDespesas;

  // Variações de contas a receber (provisioned installments)
  const { data: provisionadas } = await supabase
    .from("revenue_installments")
    .select("amount, revenues!inner(company_id)")
    .eq("revenues.company_id", companyId)
    .eq("status", "provisioned")
    .gte("due_date", startDate)
    .lte("due_date", endDate);

  const varContasReceber = (provisionadas || []).reduce((s, r) => s + Number(r.amount), 0);

  const operacional: DfcSection = {
    label: "Atividades Operacionais",
    items: [
      { label: "Resultado líquido do período", value: resultadoLiquido },
      { label: "Variação de contas a receber", value: -varContasReceber },
    ],
    total: resultadoLiquido - varContasReceber,
  };

  const investimento: DfcSection = {
    label: "Atividades de Investimento",
    items: [],
    total: 0,
  };

  const financiamento: DfcSection = {
    label: "Atividades de Financiamento",
    items: [],
    total: 0,
  };

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("current_balance")
    .eq("company_id", companyId)
    .eq("is_active", true);

  const saldoInicial = (bankAccounts || []).reduce((s, b) => s + Number(b.current_balance), 0);
  const variacaoLiquida = operacional.total + investimento.total + financiamento.total;

  return {
    method: "indirect",
    operacional,
    investimento,
    financiamento,
    variacaoLiquida,
    saldoInicial,
    saldoFinal: saldoInicial + variacaoLiquida,
  };
}
