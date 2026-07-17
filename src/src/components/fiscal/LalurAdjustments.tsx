import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { LalurAdjustment } from "@/hooks/useIrpjCsllApuracao";

interface Props {
  adjustments: LalurAdjustment[];
  onChange: (adjustments: LalurAdjustment[]) => void;
}

export default function LalurAdjustments({ adjustments, onChange }: Props) {
  const addRow = () => {
    onChange([
      ...adjustments,
      { id: crypto.randomUUID(), description: "", amount: 0, type: "addition" },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(adjustments.filter((a) => a.id !== id));
  };

  const updateRow = (id: string, field: keyof LalurAdjustment, value: any) => {
    onChange(adjustments.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const totalAdicoes = adjustments.filter((a) => a.type === "addition").reduce((s, a) => s + a.amount, 0);
  const totalExclusoes = adjustments.filter((a) => a.type === "exclusion").reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium font-heading">LALUR — Adições e Exclusões</h4>
        <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>

      {adjustments.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell>
                    <Select
                      value={adj.type}
                      onValueChange={(v) => updateRow(adj.id, "type", v)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="addition">Adição</SelectItem>
                        <SelectItem value="exclusion">Exclusão</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={adj.description}
                      onChange={(e) => updateRow(adj.id, "description", e.target.value)}
                      placeholder="Descrição"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={adj.amount || ""}
                      onChange={(e) => updateRow(adj.id, "amount", Number(e.target.value))}
                      className="h-8 text-right"
                      min={0}
                      step={0.01}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(adj.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell colSpan={2} className="text-right">
                  Adições: {formatCurrency(totalAdicoes)} | Exclusões: {formatCurrency(totalExclusoes)}
                </TableCell>
                <TableCell className="text-right">
                  Líquido: {formatCurrency(totalAdicoes - totalExclusoes)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {adjustments.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma adição ou exclusão. Clique em "Adicionar" para incluir ajustes LALUR.</p>
      )}
    </div>
  );
}
