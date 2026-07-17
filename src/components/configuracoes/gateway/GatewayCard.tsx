import { Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WEBHOOK_BASE_URL } from "@/types/gateway";
import type { GatewayConfig } from "@/hooks/useGatewayConfigs";

interface GatewayCardProps {
  config: GatewayConfig;
  onClick: () => void;
}

export function GatewayCard({ config, onClick }: GatewayCardProps) {
  return (
    <div
      className="glass-card p-5 rounded-[1.25rem] cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold text-foreground">{config.name}</h3>
        <Badge
          variant={config.is_active ? "default" : "secondary"}
          className="rounded-full text-[11px]"
        >
          {config.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </div>
      <p className="text-[12px] text-muted-foreground font-mono truncate mb-2">
        {WEBHOOK_BASE_URL}/{config.slug}
      </p>
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Webhook className="h-3.5 w-3.5" />
        <span>Webhook configurado</span>
      </div>
    </div>
  );
}
