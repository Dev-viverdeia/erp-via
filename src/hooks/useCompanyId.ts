import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCompanyId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["company-id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (error) throw error;
      return data.company_id as string;
    },
    enabled: !!user,
    staleTime: Infinity,
  });
}
