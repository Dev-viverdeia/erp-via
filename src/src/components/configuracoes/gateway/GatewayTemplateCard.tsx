import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GatewayTemplate } from "@/types/gateway";

interface GatewayTemplateCardProps {
  template: GatewayTemplate;
  onClick: () => void;
}

export function GatewayTemplateCard({ template, onClick }: GatewayTemplateCardProps) {
  return (
    <div
      className="border-2 border-dashed border-border rounded-[20px] p-5 cursor-pointer hover:border-primary/50 transition-colors duration-200"
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
      <h3 className="text-lg font-bold text-foreground mb-1">
        {template.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Clique para configurar
      </p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full text-sm h-7 cursor-pointer"
        tabIndex={-1}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Configurar
      </Button>
    </div>
  );
}
