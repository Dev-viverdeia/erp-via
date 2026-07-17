import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PartnerWithDetails = Tables<"partners">;

export function usePartnerProfile(partnerId: string | undefined) {
  const partnerQuery = useQuery({
    queryKey: ["partner-profile", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("id", partnerId!)
        .single();
      if (error) throw error;
      return data as PartnerWithDetails;
    },
    enabled: !!partnerId,
  });

  const revenuesQuery = useQuery({
    queryKey: ["partner-revenues", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenues")
        .select("*, revenue_installments(*)")
        .eq("partner_id", partnerId!)
        .is("deleted_at", null)
        .order("contracted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  const expensesQuery = useQuery({
    queryKey: ["partner-expenses", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(name), cost_centers(name)")
        .eq("partner_id", partnerId!)
        .is("deleted_at", null)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  const revenues = revenuesQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  const revenueStats = {
    total: revenues.reduce((s, r) => s + (r.total_amount ?? 0), 0),
    received: revenues
      .flatMap((r) => r.revenue_installments ?? [])
      .filter((i: any) => i.status === "paid")
      .reduce((s, i: any) => s + (i.paid_amount ?? i.amount ?? 0), 0),
    pending: revenues
      .flatMap((r) => r.revenue_installments ?? [])
      .filter((i: any) => i.status === "provisioned" || i.status === "pending")
      .reduce((s, i: any) => s + (i.amount ?? 0), 0),
    overdue: revenues
      .flatMap((r) => r.revenue_installments ?? [])
      .filter((i: any) => i.status === "overdue")
      .reduce((s, i: any) => s + (i.amount ?? 0), 0),
  };

  const expenseStats = {
    total: expenses.reduce((s, e) => s + (e.amount ?? 0), 0),
    paid: expenses.filter((e) => e.status === "paid").reduce((s, e) => s + (e.amount ?? 0), 0),
    pending: expenses.filter((e) => e.status === "pending" || e.status === "overdue").reduce((s, e) => s + (e.amount ?? 0), 0),
    overdue: expenses.filter((e) => e.status === "overdue").reduce((s, e) => s + (e.amount ?? 0), 0),
  };

  return {
    partner: partnerQuery.data,
    revenues,
    expenses,
    revenueStats,
    expenseStats,
    isLoading: partnerQuery.isLoading || revenuesQuery.isLoading || expensesQuery.isLoading,
  };
}
