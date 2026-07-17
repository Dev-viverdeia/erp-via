import { useState, useMemo } from "react";
import { useParams, useSearchParams, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GATEWAY_TEMPLATES } from "@/types/gateway";
import type { GatewayTemplate } from "@/types/gateway";
import type { GatewayConfig as GatewayConfigType } from "@/hooks/useGatewayConfigs";
import { GatewayGeneralForm } from "@/components/configuracoes/gateway/GatewayGeneralForm";
import { GatewayFieldMapper } from "@/components/configuracoes/gateway/GatewayFieldMapper";
import { GatewayFeeRulesTable } from "@/components/configuracoes/gateway/GatewayFeeRulesTable";
import { GatewayReceivableRulesEditor } from "@/components/configuracoes/gateway/GatewayReceivableRulesEditor";

const GatewayConfig = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateSlug = searchParams.get("template");

  const isNew = id === "novo" || !id;

  const { data: config, isLoading } = useQuery({
    queryKey: ["gateway-config", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gateway_configs")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as GatewayConfigType;
    },
    enabled: !isNew && !!id,
  });

  const template: GatewayTemplate | null = useMemo(() => {
    if (templateSlug) return GATEWAY_TEMPLATES.find((t) => t.slug === templateSlug) ?? null;
    return null;
  }, [templateSlug]);

  const [savedConfigId, setSavedConfigId] = useState<string | null>(null);
  const activeConfigId = config?.id ?? savedConfigId;

  const pendingMessage = (
    <p className="text-sm text-muted-foreground py-12 text-center">
      Salve a configuracao geral primeiro.
    </p>
  );

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full rounded-[20px]" />
      </div>
    );
  }

  const title = config?.name ?? template?.name ?? "Novo Gateway";
  const subtitle = config
    ? `Configuracoes do gateway ${config.name}`
    : template
      ? `Configurar gateway ${template.name}`
      : "Configure um novo gateway de pagamento";

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <NavLink
            to="/configuracoes"
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Gateways
          </NavLink>

          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
              <p className="text-base text-muted-foreground mt-1">{subtitle}</p>
            </div>
            {config && (
              <Badge
                variant={config.is_active ? "default" : "secondary"}
                className="rounded-full text-xs"
              >
                {config.is_active ? "Ativo" : "Inativo"}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="glass-panel p-6 md:p-8">
        <Tabs defaultValue="geral">
          <TabsList className="mb-6">
            <TabsTrigger value="geral" className="text-base cursor-pointer">Geral</TabsTrigger>
            <TabsTrigger value="mapeamento" className="text-base cursor-pointer">Mapeamento</TabsTrigger>
            <TabsTrigger value="taxas" className="text-base cursor-pointer">Taxas</TabsTrigger>
            <TabsTrigger value="recebimento" className="text-base cursor-pointer">Recebimento</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <GatewayGeneralForm
              config={config ?? null}
              template={template}
              onSaved={(newId) => setSavedConfigId(newId)}
            />
          </TabsContent>

          <TabsContent value="mapeamento">
            {activeConfigId ? (
              <GatewayFieldMapper configId={activeConfigId} config={config ?? null} template={template} />
            ) : pendingMessage}
          </TabsContent>

          <TabsContent value="taxas">
            {activeConfigId ? (
              <GatewayFeeRulesTable configId={activeConfigId} />
            ) : pendingMessage}
          </TabsContent>

          <TabsContent value="recebimento">
            {activeConfigId ? (
              <GatewayReceivableRulesEditor configId={activeConfigId} />
            ) : pendingMessage}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default GatewayConfig;
