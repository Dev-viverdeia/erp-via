import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type GatewayFeeRule = Tables<"gateway_fee_rules">;

export function useGatewayFeeRules(gatewayConfigId?: string) {
  return useQuery({
    queryKey: ["gateway-fee-rules", gatewayConfigId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gateway_fee_rules")
        .select("*")
        .eq("gateway_config_id", gatewayConfigId!)
        .order("payment_method")
        .order("installments_min");
      if (error) throw error;
      return data as GatewayFeeRule[];
    },
    enabled: !!gatewayConfigId,
  });
}

export function useCreateGatewayFeeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rule: TablesInsert<"gateway_fee_rules">) => {
      const { data, error } = await supabase
        .from("gateway_fee_rules")
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-fee-rules"] }),
  });
}

export function useUpdateGatewayFeeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"gateway_fee_rules"> & { id: string }) => {
      const { data, error } = await supabase
        .from("gateway_fee_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-fee-rules"] }),
  });
}

export function useDeleteGatewayFeeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gateway_fee_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-fee-rules"] }),
  });
}
