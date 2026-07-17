import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useGatewayFeeRules,
  useCreateGatewayFeeRule,
  useUpdateGatewayFeeRule,
  useDeleteGatewayFeeRule,
  type GatewayFeeRule,
} from "@/hooks/useGatewayFeeRules";

interface GatewayFeeRulesTableProps {
  configId: string;
}

const PAYMENT_METHODS = [
  { value: "*", label: "Todos" },
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartao de Credito" },
  { value: "boleto", label: "Boleto" },
  { value: "transfer", label: "Transferencia" },
];

function getMethodLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

interface FeeFormState {
  paymentMethod: string;
  installmentsMin: string;
  installmentsMax: string;
  feePercentage: string;
  fixedFee: string;
}

const INITIAL_FORM: FeeFormState = {
  paymentMethod: "*",
  installmentsMin: "1",
  installmentsMax: "1",
  feePercentage: "0",
  fixedFee: "0",
};

export function GatewayFeeRulesTable({ configId }: GatewayFeeRulesTableProps) {
  const { data: rules, isLoading, isError, refetch } = useGatewayFeeRules(configId);
  const createMutation = useCreateGatewayFeeRule();
  const updateMutation = useUpdateGatewayFeeRule();
  const deleteMutation = useDeleteGatewayFeeRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GatewayFeeRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GatewayFeeRule | null>(null);
  const [form, setForm] = useState<FeeFormState>(INITIAL_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  };

  const openEdit = (rule: GatewayFeeRule) => {
    setEditing(rule);
    setForm({
      paymentMethod: rule.payment_method,
      installmentsMin: String(rule.installments_min),
      installmentsMax: String(rule.installments_max),
      feePercentage: String(rule.fee_percentage),
      fixedFee: String(rule.fixed_fee),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      payment_method: form.paymentMethod,
      installments_min: Number(form.installmentsMin) || 1,
      installments_max: Number(form.installmentsMax) || 1,
      fee_percentage: Number(form.feePercentage) || 0,
      fixed_fee: Number(form.fixedFee) || 0,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
        toast.success("Regra de taxa atualizada");
      } else {
        await createMutation.mutateAsync({
          gateway_config_id: configId,
          ...payload,
        });
        toast.success("Regra de taxa criada");
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
        <p className="text-sm text-muted-foreground">Erro ao carregar regras de taxas.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="cursor-pointer">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Regras de Taxas</h4>
        <Button
          size="sm"
          onClick={openCreate}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Regra
        </Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metodo Pagamento</TableHead>
              <TableHead className="text-center">Parcelas Min</TableHead>
              <TableHead className="text-center">Parcelas Max</TableHead>
              <TableHead className="text-center">Taxa (%)</TableHead>
              <TableHead className="text-center">Valor Fixo (R$)</TableHead>
              <TableHead className="w-24 text-center">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rules || rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma regra de taxa configurada.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-sm">
                    {getMethodLabel(rule.payment_method)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {rule.installments_min}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {rule.installments_max}
                  </TableCell>
                  <TableCell className="text-center text-sm font-mono">
                    {rule.fee_percentage}%
                  </TableCell>
                  <TableCell className="text-center text-sm font-mono">
                    {rule.fixed_fee.toFixed(2)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Regra de Taxa" : "Nova Regra de Taxa"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Altere os parametros da regra de taxa."
                : "Configure uma nova regra de taxa para este gateway."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fee-method">Metodo de Pagamento</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}
              >
                <SelectTrigger id="fee-method" className="cursor-pointer">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee-inst-min">Parcelas Min</Label>
                <Input
                  id="fee-inst-min"
                  type="number"
                  min={1}
                  value={form.installmentsMin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, installmentsMin: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-inst-max">Parcelas Max</Label>
                <Input
                  id="fee-inst-max"
                  type="number"
                  min={1}
                  value={form.installmentsMax}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, installmentsMax: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee-pct">Taxa (%)</Label>
                <Input
                  id="fee-pct"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.feePercentage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, feePercentage: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-fixed">Valor Fixo (R$)</Label>
                <Input
                  id="fee-fixed"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.fixedFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fixedFee: e.target.value }))
                  }
                />
              </div>
            </div>
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
              disabled={isPending}
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
            <AlertDialogTitle>Remover regra de taxa?</AlertDialogTitle>
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
