import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardKpis() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-kpis", user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      // All queries in parallel
      const [revenueRes, expenseRes, balanceRes, mrrRes, overdueRes] = await Promise.all([
        // Revenue this month: sum paid_amount from installments paid this month
        supabase
          .from("revenue_installments")
          .select("paid_amount, revenues!inner(company_id, deleted_at)")
          .eq("status", "paid")
          .gte("paid_date", monthStart)
          .lte("paid_date", monthEnd),

        // Expenses this month: sum amount from paid expenses this month
        supabase
          .from("expenses")
          .select("amount")
          .eq("status", "paid")
          .is("deleted_at", null)
          .gte("paid_date", monthStart)
          .lte("paid_date", monthEnd),

        // Total balance: sum current_balance from active accounts
        supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("is_active", true),

        // MRR: sum amount from provisioned installments on active revenues
        supabase
          .from("revenue_installments")
          .select("amount, revenues!inner(status, deleted_at)")
          .eq("status", "provisioned")
          .eq("revenues.status", "active"),

        // Overdue: sum amount from overdue installments
        supabase
          .from("revenue_installments")
          .select("amount, revenues!inner(deleted_at)")
          .eq("status", "overdue"),
      ]);

      const receitaMes = (revenueRes.data ?? [])
        .filter((r: any) => r.revenues?.deleted_at === null)
        .reduce((sum: number, r: any) => sum + (Number(r.paid_amount) || 0), 0);

      const despesasMes = (expenseRes.data ?? [])
        .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

      const saldoTotal = (balanceRes.data ?? [])
        .reduce((sum: number, b: any) => sum + (Number(b.current_balance) || 0), 0);

      const mrr = (mrrRes.data ?? [])
        .filter((r: any) => r.revenues?.deleted_at === null)
        .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

      const inadimplencia = (overdueRes.data ?? [])
        .filter((r: any) => r.revenues?.deleted_at === null)
        .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

      return {
        receitaMes,
        despesasMes,
        resultado: receitaMes - despesasMes,
        saldoTotal,
        mrr,
        inadimplencia,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useRevenueExpenseMonthly() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["revenue-expense-monthly", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_revenue_expense_monthly");
      if (error) throw error;
      return (data as { month_label: string; receita: number; despesa: number }[]) ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useRecentRevenues(limit = 10) {
  return useQuery({
    queryKey: ["recent-revenues", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenues")
        .select("*, partners(name), revenue_installments(status, paid_amount)")
        .is("deleted_at", null)
        .order("contracted_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
