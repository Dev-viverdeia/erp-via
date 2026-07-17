import { useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { ReceivableSplit } from "@/types/gateway";
import {
  useGatewayReceivableRules,
  useCreateGatewayReceivableRule,
  useUpdateGatewayReceivableRule,
  useDeleteGatewayReceivableRule,
  type GatewayReceivableRule,
} from "@/hooks/useGatewayReceivableRules";

interface GatewayReceivableRulesEditorProps {
  configId: string;
}

const PAYMENT_METHODS = [
  { value: "*", label: "Todos" },
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartao de Credito" },
  { value: "boleto", label: "Boleto" },
  { value: "transfer", label: "Transferencia" },
];

const RULE_TYPES = [
  { value: "single", label: "Parcela Unica" },
  { value: "recurring_monthly", label: "Recorrencia Mensal" },
  { value: "custom", label: "Divisao Personalizada" },
];

function getMethodLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

function getRuleTypeLabel(value: string): string {
  return RULE_TYPES.find((r) => r.value === value)?.label ?? value;
}

function parseSplits(raw: unknown): ReceivableSplit[] {
  if (Array.isArray(raw)) {
    return raw as ReceivableSplit[];
  }
  return [];
}

interface SplitRow {
  id: string;
  percentage: string;
  daysOffset: string;
}

interface RuleFormState {
  paymentMethod: string;
  ruleType: string;
  recurringMonths: string;
  splits: SplitRow[];
}

const INITIAL_FORM: RuleFormState = {
  paymentMethod: "*",
  ruleType: "single",
  recurringMonths: "1",
  splits: [],
};

export function GatewayReceivableRulesEditor({ configId }: GatewayReceivableRulesEditorProps) {
  const { data: rules, isLoading, isError, refetch } = useGatewayReceivableRules(configId);
  const createMutation = useCreateGatewayReceivableRule();
  const updateMutation = useUpdateGatewayReceivableRule();
  const deleteMutation = useDeleteGatewayReceivableRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GatewayReceivableRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GatewayReceivableRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(INITIAL_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  };

  const openEdit = (rule: GatewayReceivableRule) => {
    setEditing(rule);
    const existingSplits = parseSplits(rule.splits);
    setForm({
      paymentMethod: rule.payment_method,
      ruleType: rule.rule_type,
      recurringMonths: String(rule.recurring_months ?? 1),
      splits: existingSplits.map((s) => ({
        id: crypto.randomUUID(),
        percentage: String(s.percentage),
        daysOffset: String(s.days_offset),
      })),
    });
    setDialogOpen(true);
  };

  const handleAddSplit = () => {
    setForm((f) => ({
      ...f,
      splits: [
        ...f.splits,
        { id: crypto.randomUUID(), percentage: "0", daysOffset: "0" },
      ],
    }));
  };

  const handleRemoveSplit = (id: string) => {
    setForm((f) => ({
      ...f,
      splits: f.splits.filter((s) => s.id !== id),
    }));
  };

  const handleSplitChange = (id: string, field: "percentage" | "daysOffset", value: string) => {
    setForm((f) => ({
      ...f,
      splits: f.splits.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const splitsTotal = form.splits.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
  const splitsValid = form.ruleType !== "custom" || Math.abs(splitsTotal - 100) < 0.01;

  const handleSave = async () => {
    const splits: ReceivableSplit[] = form.splits.map((s) => ({
      percentage: Number(s.percentage) || 0,
      days_offset: Number(s.daysOffset) || 0,
    }));

    const payload = {
      payment_method: form.paymentMethod,
      rule_type: form.ruleType,
      recurring_months:
        form.ruleType === "recurring_monthly" ? Number(form.recurringMonths) || 1 : null,
      splits: form.ruleType === "custom" ? (splits as unknown as Record<string, unknown>[]) : null,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
        toast.success("Regra de recebimento atualizada");
      } else {
        await createMutation.mutateAsync({
          gateway_config_id: configId,
          ...payload,
        });
        toast.success("Regra de recebimento criada");
      }
      setDialogOpen(false);
    } catch {
      toast.error(editing ? "Erro ao atualizar regra" : "Erro ao criar regra");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Regra removida");
      setDeleteTarget(null);
    } catch {
      toast.error("Erro ao remover regra");
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar regras de recebimento.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="cursor-pointer">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Regras de Recebimento</h4>
        <Button size="sm" onClick={openCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1" />
          Nova Regra
        </Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metodo Pagamento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Detalhes</TableHead>
              <TableHead className="w-24 text-center">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rules || rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhuma regra de recebimento configurada.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => {
                const splits = parseSplits(rule.splits);
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="text-sm">
                      {getMethodLabel(rule.payment_method)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs rounded-full">
                        {getRuleTypeLabel(rule.rule_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {rule.rule_type === "recurring_monthly" && (
                        <span>{rule.recurring_months} meses</span>
                      )}
                      {rule.rule_type === "custom" && (
                        <span>{splits.length} splits</span>
                      )}
                      {rule.rule_type === "single" && <span>--</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(rule)}
                          className="h-8 w-8 cursor-pointer"
                          aria-label="Editar regra"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(rule)}
                          className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive transition-colors duration-200"
                          aria-label="Remover regra"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Regra de Recebimento" : "Nova Regra de Recebimento"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Altere os parametros da regra de recebimento."
                : "Configure como os recebiveis serao gerados para este metodo de pagamento."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recv-method">Metodo de Pagamento</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}
              >
                <SelectTrigger id="recv-method" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recv-type">Tipo de Regra</Label>
              <Select
                value={form.ruleType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    ruleType: v,
                    splits: v === "custom" && f.splits.length === 0
                      ? [{ id: crypto.randomUUID(), percentage: "100", daysOffset: "0" }]
                      : f.splits,
                  }))
                }
              >
                <SelectTrigger id="recv-type" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring months field */}
            {form.ruleType === "recurring_monthly" && (
              <div className="space-y-2">
                <Label htmlFor="recv-months">Quantidade de Meses</Label>
                <Input
                  id="recv-months"
                  type="number"
                  min={1}
                  value={form.recurringMonths}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recurringMonths: e.target.value }))
                  }
                />
              </div>
            )}

            {/* Custom splits editor */}
            {form.ruleType === "custom" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Divisao (Splits)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSplit}
                    className="cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar Split
                  </Button>
                </div>

                {form.splits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum split configurado. Adicione ao menos um.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.splits.map((split, idx) => (
                      <div
                        key={split.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30"
                      >
                        <span className="text-xs text-muted-foreground w-6 shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Percentual (%)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={100}
                            value={split.percentage}
                            onChange={(e) =>
                              handleSplitChange(split.id, "percentage", e.target.value)
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            D+ (dias)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={split.daysOffset}
                            onChange={(e) =>
                              handleSplitChange(split.id, "daysOffset", e.target.value)
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSplit(split.id)}
                          className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive transition-colors duration-200 mt-5"
                          aria-label="Remover split"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Validation warning */}
                    {!splitsValid && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-status-warning-lighter text-sm">
                        <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))] shrink-0" />
                        <span className="text-[hsl(var(--status-warning))]">
                          A soma dos percentuais e {splitsTotal.toFixed(2)}%. Deve ser 100%.
                        </span>
                      </div>
                    )}

                    {splitsValid && form.splits.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Total: {splitsTotal.toFixed(2)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || (form.ruleType === "custom" && !splitsValid)}
              className="cursor-pointer"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover regra de recebimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa acao nao pode ser desfeita. A regra sera removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
