import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from "sonner";

export interface CostCenter {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCostCenters(includeInactive = false) {
  return useQuery({
    queryKey: ["cost-centers", includeInactive],
    queryFn: async () => {
      let query = supabase.from("cost_centers").select("*").order("code").order("name");
      if (!includeInactive) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CostCenter[];
    },
  });
}

export function useCreateCostCenter() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async ({ name, code, parent_id }: { name: string; code?: string; parent_id?: string | null }) => {
      const { error } = await supabase
        .from("cost_centers")
        .insert({ name, code: code || null, parent_id: parent_id || null, company_id: companyId! } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success("Centro de custo criado");
    },
    onError: () => toast.error("Erro ao criar centro de custo"),
  });
}

export function useUpdateCostCenter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; code?: string; is_active?: boolean; parent_id?: string | null }) => {
      const { error } = await supabase.from("cost_centers").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success("Centro de custo atualizado");
    },
    onError: () => toast.error("Erro ao atualizar centro de custo"),
  });
}
