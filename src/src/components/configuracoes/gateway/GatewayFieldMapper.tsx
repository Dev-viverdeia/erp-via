import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  MAPPABLE_FIELDS,
  GATEWAY_INTERNAL_EVENTS,
  extractJsonPaths,
} from "@/types/gateway";
import type {
  GatewayTemplate,
  GatewayFieldMapping,
  GatewayEventMapping,
  GatewayInternalEvent,
} from "@/types/gateway";
import type { GatewayConfig } from "@/hooks/useGatewayConfigs";
import { useUpdateGatewayConfig } from "@/hooks/useGatewayConfigs";

interface GatewayFieldMapperProps {
  configId: string;
  config: GatewayConfig | null;
  template: GatewayTemplate | null;
}

interface EventMappingRow {
  id: string;
  gatewayEvent: string;
  internalEvent: GatewayInternalEvent;
}

const EMPTY_SELECT_VALUE = "__none__";

function parseFieldMapping(raw: unknown): GatewayFieldMapping {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as GatewayFieldMapping;
  }
  return {};
}

function parseEventMapping(raw: unknown): GatewayEventMapping {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as GatewayEventMapping;
  }
  return {};
}

function eventMappingToRows(mapping: GatewayEventMapping): EventMappingRow[] {
  return Object.entries(mapping).map(([gatewayEvent, internalEvent]) => ({
    id: crypto.randomUUID(),
    gatewayEvent,
    internalEvent,
  }));
}

export function GatewayFieldMapper({ configId, config, template }: GatewayFieldMapperProps) {
  const updateMutation = useUpdateGatewayConfig();

  const initialFieldMapping = config?.field_mapping
    ? parseFieldMapping(config.field_mapping)
    : template?.fieldMapping ?? {};

  const initialEventMapping = config?.event_mapping
    ? parseEventMapping(config.event_mapping)
    : template?.eventMapping ?? {};

  const initialPayload = config?.sample_payload
    ? (typeof config.sample_payload === "string"
        ? config.sample_payload
        : JSON.stringify(config.sample_payload, null, 2))
    : "";

  const [jsonText, setJsonText] = useState(initialPayload);
  const [extractedPaths, setExtractedPaths] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<GatewayFieldMapping>(initialFieldMapping);
  const [eventRows, setEventRows] = useState<EventMappingRow[]>(
    eventMappingToRows(initialEventMapping)
  );
  const [pathsExtracted, setPathsExtracted] = useState(false);

  // Auto-extract paths if there is already a sample payload
  useEffect(() => {
    if (initialPayload) {
      try {
        const parsed = JSON.parse(initialPayload);
        const paths = extractJsonPaths(parsed);
        if (paths.length > 0) {
          setExtractedPaths(paths);
          setPathsExtracted(true);
        }
      } catch {
        // ignore parse errors on initial load
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleParseJson = useCallback(() => {
    if (!jsonText.trim()) {
      toast.error("Cole um payload JSON antes de analisar");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(jsonText);
      const paths = extractJsonPaths(parsed);
      if (paths.length === 0) {
        toast.error("Nenhum caminho encontrado no JSON");
        return;
      }
      setExtractedPaths(paths);
      setPathsExtracted(true);
      toast.success(`${paths.length} campos encontrados`);
    } catch {
      toast.error("JSON invalido. Verifique a formatacao.");
    }
  }, [jsonText]);

  const handleFieldMappingChange = (fieldKey: string, jsonPath: string) => {
    setFieldMapping((prev) => {
      const next = { ...prev };
      if (jsonPath === EMPTY_SELECT_VALUE) {
        delete next[fieldKey];
      } else {
        next[fieldKey] = jsonPath;
      }
      return next;
    });
  };

  const handleAddEventRow = () => {
    setEventRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        gatewayEvent: "",
        internalEvent: "payment_confirmed",
      },
    ]);
  };

  const handleRemoveEventRow = (id: string) => {
    setEventRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEventRowChange = (
    id: string,
    field: "gatewayEvent" | "internalEvent",
    value: string
  ) => {
    setEventRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSave = async () => {
    const eventMapping: GatewayEventMapping = {};
    for (const row of eventRows) {
      if (row.gatewayEvent.trim()) {
        eventMapping[row.gatewayEvent.trim()] = row.internalEvent;
      }
    }

    let samplePayload: unknown = null;
    if (jsonText.trim()) {
      try {
        samplePayload = JSON.parse(jsonText);
      } catch {
        // store as-is if not valid JSON
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: configId,
        field_mapping: fieldMapping as Record<string, unknown>,
        event_mapping: eventMapping as Record<string, unknown>,
        sample_payload: samplePayload as Record<string, unknown> | null,
      });
      toast.success("Mapeamento salvo com sucesso");
    } catch {
      toast.error("Erro ao salvar mapeamento");
    }
  };

  const showMappingTable = pathsExtracted || Object.keys(fieldMapping).length > 0;

  return (
    <div className="space-y-6">
      {/* Section 1: JSON Parser */}
      <div className="space-y-3">
        <Label htmlFor="gw-json-payload">Payload de Exemplo</Label>
        <Textarea
          id="gw-json-payload"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"event": "payment.confirmed", "customer": {"name": "...", "email": "..."}, ...}'
          className="font-mono text-sm min-h-[200px]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleParseJson}
          className="cursor-pointer"
        >
          <Search className="h-4 w-4 mr-1.5" />
          Analisar JSON
        </Button>
      </div>

      {/* Section 2: Field Mapping Table */}
      {showMappingTable && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Mapeamento de Campos
          </h4>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Campo Interno</TableHead>
                  <TableHead>Caminho no JSON</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MAPPABLE_FIELDS.map((field) => (
                  <TableRow key={field.key}>
                    <TableCell className="text-sm">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={fieldMapping[field.key] ?? EMPTY_SELECT_VALUE}
                        onValueChange={(val) =>
                          handleFieldMappingChange(field.key, val)
                        }
                      >
                        <SelectTrigger className="h-8 text-sm font-mono cursor-pointer">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_SELECT_VALUE}>
                            -- Nenhum --
                          </SelectItem>
                          {extractedPaths.map((path) => (
                            <SelectItem key={path} value={path}>
                              {path}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Section 3: Event Mapping */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Mapeamento de Eventos
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEventRow}
            className="cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar
          </Button>
        </div>

        {eventRows.length > 0 ? (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento do Gateway</TableHead>
                  <TableHead>Evento Interno</TableHead>
                  <TableHead className="w-16 text-center">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Input
                        value={row.gatewayEvent}
                        onChange={(e) =>
                          handleEventRowChange(row.id, "gatewayEvent", e.target.value)
                        }
                        placeholder="Ex: payment.confirmed"
                        className="h-8 text-sm font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.internalEvent}
                        onValueChange={(val) =>
                          handleEventRowChange(
                            row.id,
                            "internalEvent",
                            val
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-sm cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GATEWAY_INTERNAL_EVENTS.map((evt) => (
                            <SelectItem key={evt.value} value={evt.value}>
                              {evt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEventRow(row.id)}
                        className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive transition-colors duration-200"
                        aria-label="Remover evento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum evento mapeado. Clique em "Adicionar" para configurar.
          </p>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="cursor-pointer"
        >
          {updateMutation.isPending ? "Salvando..." : "Salvar Mapeamento"}
        </Button>
      </div>
    </div>
  );
}
