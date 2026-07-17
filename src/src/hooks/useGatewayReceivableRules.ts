import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type GatewayReceivableRule = Tables<"gateway_receivable_rules">;

export function useGatewayReceivableRules(gatewayConfigId?: string) {
  return useQuery({
    queryKey: ["gateway-receivable-rules", gatewayConfigId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gateway_receivable_rules")
        .select("*")
        .eq("gateway_config_id", gatewayConfigId!)
        .order("payment_method");
      if (error) throw error;
      return data as GatewayReceivableRule[];
    },
    enabled: !!gatewayConfigId,
  });
}

export function useCreateGatewayReceivableRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rule: TablesInsert<"gateway_receivable_rules">) => {
      const { data, error } = await supabase
        .from("gateway_receivable_rules")
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-receivable-rules"] }),
  });
}

export function useUpdateGatewayReceivableRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"gateway_receivable_rules"> & { id: string }) => {
      const { data, error } = await supabase
        .from("gateway_receivable_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-receivable-rules"] }),
  });
}

export function useDeleteGatewayReceivableRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gateway_receivable_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateway-receivable-rules"] }),
  });
}
