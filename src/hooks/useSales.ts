import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Sale = Tables<"sales"> & {
  partners: { name: string } | null;
};

export function useSales(search?: string, statusFilter?: string) {
  return useQuery({
    queryKey: ["sales", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select("*, partners(name)")
        .is("deleted_at", null)
        .order("sale_date", { ascending: false });

      if (search) {
        query = query.or(`description.ilike.%${search}%,product_name.ilike.%${search}%`);
      }
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sale: {
      partner_id?: string | null;
      description?: string;
      product_name?: string;
      total_amount: number;
      payment_method: string;
      installments_count: number;
      sale_date: string;
      requires_nf?: boolean;
      gateway_config_id?: string | null;
      gateway_ref?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("sales")
        .insert({
          company_id: companyId!,
          created_by: user!.id,
          partner_id: sale.partner_id || null,
          description: sale.description,
          product_name: sale.product_name,
          total_amount: sale.total_amount,
          payment_method: sale.payment_method,
          installments_count: sale.installments_count,
          sale_date: sale.sale_date,
          requires_nf: sale.requires_nf ?? true,
          gateway_config_id: sale.gateway_config_id || null,
          gateway_ref: sale.gateway_ref || null,
        })
        .select("*, partners(name)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"sales"> & { id: string }) => {
      const { data, error } = await supabase
        .from("sales")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });
}
