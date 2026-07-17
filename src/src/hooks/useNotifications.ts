import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";

interface NotificationData {
  overdueInstallmentsCount: number;
  overdueInstallmentsSum: number;
  overdueExpensesCount: number;
  overdueExpensesSum: number;
  total: number;
}

export function useNotifications() {
  const { data: companyId } = useCompanyId();

  return useQuery<NotificationData>({
    queryKey: ["notifications", companyId],
    queryFn: async () => {
      const [installmentsRes, expensesRes] = await Promise.all([
        supabase
          .from("revenue_installments")
          .select("amount, revenue_id")
          .eq("status", "overdue"),
        supabase
          .from("expenses")
          .select("amount")
          .eq("company_id", companyId!)
          .eq("status", "overdue")
          .is("deleted_at", null),
      ]);

      const installments = installmentsRes.data ?? [];
      const expenses = expensesRes.data ?? [];

      return {
        overdueInstallmentsCount: installments.length,
        overdueInstallmentsSum: installments.reduce((s, i) => s + Number(i.amount), 0),
        overdueExpensesCount: expenses.length,
        overdueExpensesSum: expenses.reduce((s, e) => s + Number(e.amount), 0),
        total: installments.length + expenses.length,
      };
    },
    enabled: !!companyId,
    staleTime: 60_000,
    refetchInterval: 300_000,
  });
}
