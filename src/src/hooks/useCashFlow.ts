import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays } from "date-fns";

export interface CashFlowDay {
  date: string;
  label: string;
  saldo: number;
  entradas: number;
  saidas: number;
}

export interface CashFlowMovement {
  date: string;
  description: string;
  type: "entrada" | "saida";
  amount: number;
  status: string;
}

export function useCashFlow(days = 90) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cash-flow", days, user?.id],
    queryFn: async () => {
      const today = new Date();
      const endDate = addDays(today, days);
      const todayStr = format(today, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      const [balanceRes, inflowsRes, outflowsRes] = await Promise.all([
        supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("is_active", true),

        supabase
          .from("revenue_installments")
          .select("due_date, amount, revenues!inner(deleted_at, partner_id, partners(name))")
          .eq("status", "provisioned")
          .gte("due_date", todayStr)
          .lte("due_date", endStr)
          .order("due_date"),

        supabase
          .from("expenses")
          .select("due_date, amount, description")
          .eq("status", "pending")
          .is("deleted_at", null)
          .gte("due_date", todayStr)
          .lte("due_date", endStr)
          .order("due_date"),
      ]);

      const saldoInicial = (balanceRes.data ?? [])
        .reduce((sum, b) => sum + (Number(b.current_balance) || 0), 0);

      // Build daily map
      const dailyMap: Record<string, { entradas: number; saidas: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = format(addDays(today, i), "yyyy-MM-dd");
        dailyMap[d] = { entradas: 0, saidas: 0 };
      }

      const inflows = (inflowsRes.data ?? []).filter(
        (r: any) => r.revenues?.deleted_at === null
      );
      for (const inf of inflows) {
        const d = inf.due_date;
        if (dailyMap[d]) dailyMap[d].entradas += Number(inf.amount) || 0;
      }

      for (const out of outflowsRes.data ?? []) {
        const d = out.due_date;
        if (dailyMap[d]) dailyMap[d].saidas += Number(out.amount) || 0;
      }

      // Build cumulative projection
      let saldo = saldoInicial;
      const projection: CashFlowDay[] = [];
      for (let i = 0; i < days; i++) {
        const d = format(addDays(today, i), "yyyy-MM-dd");
        const day = dailyMap[d];
        saldo += day.entradas - day.saidas;
        const dt = addDays(today, i);
        projection.push({
          date: d,
          label: format(dt, "dd/MM"),
          saldo,
          entradas: day.entradas,
          saidas: day.saidas,
        });
      }

      // Build movements list
      const movements: CashFlowMovement[] = [];
      for (const inf of inflows) {
        const partnerName = (inf as any).revenues?.partners?.name ?? "Receita";
        movements.push({
          date: inf.due_date,
          description: `Parcela - ${partnerName}`,
          type: "entrada",
          amount: Number(inf.amount),
          status: "provisioned",
        });
      }
      for (const out of outflowsRes.data ?? []) {
        movements.push({
          date: out.due_date,
          description: out.description || "Despesa",
          type: "saida",
          amount: Number(out.amount),
          status: "pending",
        });
      }
      movements.sort((a, b) => a.date.localeCompare(b.date));

      // Summary for 30 days
      const thirtyDays = projection.slice(0, Math.min(30, days));
      const entradasPrev30 = thirtyDays.reduce((s, d) => s + d.entradas, 0);
      const saidasPrev30 = thirtyDays.reduce((s, d) => s + d.saidas, 0);
      const saldoProjetado30 = thirtyDays.length > 0 ? thirtyDays[thirtyDays.length - 1].saldo : saldoInicial;

      return {
        saldoAtual: saldoInicial,
        entradasPrev30,
        saidasPrev30,
        saldoProjetado30,
        projection,
        movements,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
