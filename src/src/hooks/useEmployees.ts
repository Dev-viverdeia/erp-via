import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Employee = Tables<"employees"> & { partners: { name: string } | null };

export function useEmployees(search?: string, contractTypeFilter?: string) {
  return useQuery({
    queryKey: ["employees", search, contractTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("employees")
        .select("*, partners(name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (contractTypeFilter && contractTypeFilter !== "all") {
        query = query.eq("contract_type", contractTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data as Employee[];
      if (search) {
        const s = search.toLowerCase();
        results = results.filter(
          (e) =>
            e.partners?.name?.toLowerCase().includes(s) ||
            e.role?.toLowerCase().includes(s) ||
            e.department?.toLowerCase().includes(s)
        );
      }
      return results;
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (employee: Omit<TablesInsert<"employees">, "company_id" | "created_by">) => {
      const { data, error } = await supabase
        .from("employees")
        .insert({ ...employee, company_id: companyId!, created_by: user!.id })
        .select("*, partners(name)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"employees"> & { id: string }) => {
      const { data, error } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", id)
        .select("*, partners(name)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}
