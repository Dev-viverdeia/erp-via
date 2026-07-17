import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type GatewayConfig = Tables<"gateway_configs">;

export function useGatewayConfigs() {
  return useQuery({
    queryKey: ["gateway-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gateway_configs")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as GatewayConfig[];
    },
  });
}

export function useCreateGatewayConfig() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: Omit<TablesInsert<"gateway_configs">, "company_id">) => {
      // 1. Auto-create vendor partner
      const { data: partner, error: partnerError } = await supabase
        .from("partners")
        .insert({
          company_id: companyId!,
          created_by: user!.id,
          name: `${config.name} (Gateway)`,
          type: "vendor",
          tags: ["gateway"],
        })
        .select()
        .single();
      if (partnerError) throw partnerError;

      // 2. Create gateway config with vendor partner
      const { data, error } = await supabase
        .from("gateway_configs")
        .insert({
          ...config,
          company_id: companyId!,
          vendor_partner_id: partner.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-configs"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

export function useUpdateGatewayConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"gateway_configs"> & { id: string }) => {
      const { data, error } = await supabase
        .from("gateway_configs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-configs"] }),
  });
}

export function useDeleteGatewayConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gateway_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-configs"] }),
  });
}
