import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SaleWithDetails = Tables<"sales"> & {
  partners: { name: string; document: string | null; email: string | null } | null;
};

export function useSaleDetails(saleId: string | undefined) {
  const saleQuery = useQuery({
    queryKey: ["sale-details", saleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, partners(name, document, email)")
        .eq("id", saleId!)
        .single();
      if (error) throw error;
      return data as SaleWithDetails;
    },
    enabled: !!saleId,
  });

  const revenuesQuery = useQuery({
    queryKey: ["sale-revenues", saleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenues")
        .select("*, revenue_installments(*)")
        .eq("sale_id", saleId!)
        .is("deleted_at", null)
        .order("contracted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!saleId,
  });

  const expensesQuery = useQuery({
    queryKey: ["sale-expenses", saleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, partners(name), expense_categories(name)")
        .eq("sale_id", saleId!)
        .is("deleted_at", null)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!saleId,
  });

  const revenues = revenuesQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  const totalReceivable = revenues.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalFees = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const netAmount = totalReceivable - totalFees;

  const installments = revenues.flatMap((r) =>
    (r.revenue_installments ?? []).map((i: Record<string, unknown>) => ({
      ...(i as Tables<"revenue_installments">),
      revenue_description: r.notes ?? `Receita ${r.payment_type}`,
    }))
  );

  return {
    sale: saleQuery.data,
    revenues,
    expenses,
    installments,
    totalReceivable,
    totalFees,
    netAmount,
    isLoading: saleQuery.isLoading || revenuesQuery.isLoading || expensesQuery.isLoading,
  };
}
