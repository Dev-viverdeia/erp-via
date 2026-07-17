import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
  appmax: "Appmax",
  hubla: "Hubla",
  crm: "CRM",
};

export function IntegrationsTab() {
  const { data: companyId } = useCompanyId();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["integration-configs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_configs")
        .select("id, provider, is_active, endpoint_url, created_at")
        .eq("company_id", companyId!)
        .order("provider");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  }

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16">
        <Plug className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhuma integração configurada.</p>
        <p className="text-xs text-muted-foreground">Integrações com Appmax, Hubla e CRM serão listadas aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {configs.map((cfg) => (
        <Card key={cfg.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {PROVIDER_LABELS[cfg.provider] ?? cfg.provider}
            </CardTitle>
            <Badge variant={cfg.is_active ? "default" : "secondary"}>
              {cfg.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {cfg.endpoint_url ? (
              <p className="truncate">Endpoint: {cfg.endpoint_url}</p>
            ) : (
              <p>Sem endpoint configurado</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
