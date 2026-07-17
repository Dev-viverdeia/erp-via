import { useState, useEffect } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { WEBHOOK_BASE_URL } from "@/types/gateway";
import type { GatewayTemplate } from "@/types/gateway";
import type { GatewayConfig } from "@/hooks/useGatewayConfigs";
import { useCreateGatewayConfig, useUpdateGatewayConfig } from "@/hooks/useGatewayConfigs";

interface GatewayGeneralFormProps {
  config: GatewayConfig | null;
  template: GatewayTemplate | null;
  onSaved: (id: string) => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function generateSecret(): string {
  return crypto.randomUUID();
}

export function GatewayGeneralForm({ config, template, onSaved }: GatewayGeneralFormProps) {
  const createMutation = useCreateGatewayConfig();
  const updateMutation = useUpdateGatewayConfig();

  const [name, setName] = useState(config?.name ?? template?.name ?? "");
  const [slug, setSlug] = useState(config?.slug ?? template?.slug ?? "");
  const [isActive, setIsActive] = useState(config?.is_active ?? true);
  const [webhookSecret, setWebhookSecret] = useState(config?.webhook_secret ?? generateSecret());
  const [secretHeader, setSecretHeader] = useState(
    config?.webhook_secret_header ?? template?.webhookSecretHeader ?? "x-webhook-token"
  );
  const [showSecret, setShowSecret] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (!slugManuallyEdited && !config) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited, config]);

  const webhookUrl = `${WEBHOOK_BASE_URL}/${slug}`;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isValid = name.trim().length > 0 && slug.trim().length > 0;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("URL copiada para a area de transferencia");
    } catch {
      toast.error("Falha ao copiar URL");
    }
  };

  const handleRegenerateSecret = () => {
    setWebhookSecret(generateSecret());
    toast.success("Novo secret gerado");
  };

  const handleSave = async () => {
    if (!isValid) return;

    try {
      if (config) {
        await updateMutation.mutateAsync({
          id: config.id,
          name: name.trim(),
          slug: slug.trim(),
          is_active: isActive,
          webhook_secret: webhookSecret,
          webhook_secret_header: secretHeader.trim(),
        });
        toast.success("Gateway atualizado com sucesso");
        onSaved(config.id);
      } else {
        const data = await createMutation.mutateAsync({
          name: name.trim(),
          slug: slug.trim(),
          is_active: isActive,
          webhook_secret: webhookSecret,
          webhook_secret_header: secretHeader.trim(),
          field_mapping: template?.fieldMapping ? (template.fieldMapping as Record<string, unknown>) : null,
          event_mapping: template?.eventMapping ? (template.eventMapping as Record<string, unknown>) : null,
        });
        toast.success("Gateway criado com sucesso");
        onSaved(data.id);
      }
    } catch {
      toast.error(config ? "Erro ao atualizar gateway" : "Erro ao criar gateway");
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="gw-name">Nome</Label>
        <Input
          id="gw-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Hubla, Hotmart..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gw-slug">Slug</Label>
        <Input
          id="gw-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManuallyEdited(true);
          }}
          placeholder="ex: hubla"
          className="font-mono"
        />
        <p className="text-[11px] text-muted-foreground">
          Identificador unico usado na URL do webhook
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="gw-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="gw-active" className="cursor-pointer">
          Ativo
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gw-webhook-url">URL do Webhook</Label>
        <div className="flex gap-2">
          <Input
            id="gw-webhook-url"
            value={webhookUrl}
            readOnly
            className="font-mono text-[12px] bg-muted/50"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopyUrl}
            className="shrink-0 cursor-pointer"
            aria-label="Copiar URL"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gw-secret">Secret do Webhook</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="gw-secret"
              type={showSecret ? "text" : "password"}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="font-mono text-[12px] pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 cursor-pointer"
              onClick={() => setShowSecret(!showSecret)}
              aria-label={showSecret ? "Ocultar secret" : "Mostrar secret"}
            >
              {showSecret ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerateSecret}
            className="shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Regenerar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gw-secret-header">Header do Secret</Label>
        <Input
          id="gw-secret-header"
          value={secretHeader}
          onChange={(e) => setSecretHeader(e.target.value)}
          placeholder="x-webhook-token"
          className="font-mono text-[12px]"
        />
        <p className="text-[11px] text-muted-foreground">
          Nome do header HTTP onde o gateway envia o secret para validacao
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={!isValid || isPending}
          className="cursor-pointer"
        >
          {isPending ? "Salvando..." : config ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
