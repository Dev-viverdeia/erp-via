import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";

export interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  record_id: string | null;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  company_id: string | null;
}

interface UseAuditLogsOptions {
  tableFilter?: string;
  actionFilter?: string;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["audit-logs", companyId, options.tableFilter, options.actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (options.tableFilter) {
        query = query.eq("table_name", options.tableFilter);
      }
      if (options.actionFilter) {
        query = query.eq("action", options.actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
    enabled: !!companyId,
  });
}
