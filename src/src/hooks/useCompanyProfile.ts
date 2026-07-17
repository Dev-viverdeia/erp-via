import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { toast } from "sonner";

export function useCompanyProfile() {
  const { data: companyId } = useCompanyId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["company-profile", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { name?: string; cnpj?: string | null; tax_regime?: string }) => {
      const { error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      toast.success("Dados da empresa atualizados");
    },
    onError: () => {
      toast.error("Erro ao atualizar dados da empresa");
    },
  });

  return { ...query, updateCompany: updateMutation.mutate, isUpdating: updateMutation.isPending };
}
