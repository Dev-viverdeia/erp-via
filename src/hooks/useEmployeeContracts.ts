import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type EmployeeContract = Tables<"employee_contracts">;

export function useEmployeeContracts(employeeId?: string) {
  return useQuery({
    queryKey: ["employee-contracts", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_contracts")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as EmployeeContract[];
    },
    enabled: !!employeeId,
  });
}

export function useCreateEmployeeContract() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (contract: Omit<TablesInsert<"employee_contracts">, "company_id">) => {
      const { data, error } = await supabase
        .from("employee_contracts")
        .insert({ ...contract, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-contracts"] }),
  });
}

export function useUpdateEmployeeContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"employee_contracts"> & { id: string }) => {
      const { data, error } = await supabase
        .from("employee_contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-contracts"] }),
  });
}
