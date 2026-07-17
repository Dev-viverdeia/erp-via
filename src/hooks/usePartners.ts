import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Partner = Tables<"partners">;

export function usePartners(search?: string, typeFilter?: string) {
  return useQuery({
    queryKey: ["partners", search, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("partners")
        .select("*")
        .is("deleted_at", null)
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,document.ilike.%${search}%`);
      }
      if (typeFilter && typeFilter !== "all") {
        query = query.in("type", typeFilter === "customer" ? ["customer", "both"] : typeFilter === "vendor" ? ["vendor", "both"] : [typeFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Partner[];
    },
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (partner: Omit<TablesInsert<"partners">, "company_id" | "created_by">) => {
      const { data, error } = await supabase
        .from("partners")
        .insert({ ...partner, company_id: companyId!, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"partners"> & { id: string }) => {
      const { data, error } = await supabase
        .from("partners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("partners")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}
