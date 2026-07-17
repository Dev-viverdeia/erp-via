import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGatewayConfigs } from "@/hooks/useGatewayConfigs";
import { GATEWAY_TEMPLATES } from "@/types/gateway";
import { GatewayCard } from "./gateway/GatewayCard";
import { GatewayTemplateCard } from "./gateway/GatewayTemplateCard";

export function GatewaysTab() {
  const navigate = useNavigate();
  const { data: configs, isLoading, isError, refetch } = useGatewayConfigs();

  const configuredSlugs = useMemo(() => {
    if (!configs) return new Set<string>();
    return new Set(configs.map((c) => c.slug));
  }, [configs]);

  const unconfiguredTemplates = useMemo(() => {
    return GATEWAY_TEMPLATES.filter((t) => !configuredSlugs.has(t.slug));
  }, [configuredSlugs]);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[1.25rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar gateways.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="cursor-pointer">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const hasConfigs = configs && configs.length > 0;
  const hasTemplates = unconfiguredTemplates.length > 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-heading text-foreground">
          Gateways de Pagamento
        </h2>
        <Button
          size="sm"
          onClick={() => navigate("/configuracoes/gateways/novo")}
          className="rounded-full cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Gateway
        </Button>
      </div>

      {!hasConfigs && !hasTemplates && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum gateway configurado. Comece adicionando um novo gateway.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {configs?.map((config) => (
          <GatewayCard
            key={config.id}
            config={config}
            onClick={() => navigate(`/configuracoes/gateways/${config.id}`)}
          />
        ))}

        {unconfiguredTemplates.map((template) => (
          <GatewayTemplateCard
            key={template.slug}
            template={template}
            onClick={() => navigate(`/configuracoes/gateways/novo?template=${template.slug}`)}
          />
        ))}
      </div>
    </div>
  );
}
