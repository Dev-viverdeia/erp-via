import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useCreateJournalEntry } from "@/hooks/useJournalEntries";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { usePartners } from "@/hooks/usePartners";
import { useCostCenters } from "@/hooks/useCostCenters";
import { formatCurrency } from "@/lib/format";

interface LineInput {
  account_id: string;
  debit_amount: string;
  credit_amount: string;
  description: string;
  partner_id: string;
  cost_center_id: string;
}

const emptyLine = (): LineInput => ({
  account_id: "",
  debit_amount: "",
  credit_amount: "",
  description: "",
  partner_id: "",
  cost_center_id: "",
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalEntryFormPanel({ open, onOpenChange }: Props) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineInput[]>([emptyLine(), emptyLine()]);

  const createEntry = useCreateJournalEntry();
  const { data: accounts } = useChartOfAccounts();
  const { data: partners } = usePartners();
  const { data: costCenters } = useCostCenters();

  const analyticalAccounts = accounts?.filter((a) => a.is_analytical) || [];

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit_amount) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit_amount) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && diff < 0.01;
  const canSave = description && entryDate && lines.length >= 2 && isBalanced && lines.every((l) => l.account_id);

  const updateLine = (idx: number, field: keyof LineInput, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const handleSubmit = () => {
    createEntry.mutate(
      {
        entry_date: entryDate,
        description,
        lines: lines.map((l) => ({
          account_id: l.account_id,
          debit_amount: parseFloat(l.debit_amount) || 0,
          credit_amount: parseFloat(l.credit_amount) || 0,
          description: l.description || undefined,
          partner_id: l.partner_id || undefined,
          cost_center_id: l.cost_center_id || undefined,
        })),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setDescription("");
          setLines([emptyLine(), emptyLine()]);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Lançamento Contábil</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data*</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição*</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do lançamento" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Partidas</Label>
              <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
                <Plus className="h-3 w-3 mr-1" /> Linha
              </Button>
            </div>

            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Conta*</TableHead>
                    <TableHead className="w-28">Débito</TableHead>
                    <TableHead className="w-28">Crédito</TableHead>
                    <TableHead className="min-w-[120px]">Descrição</TableHead>
                    <TableHead className="min-w-[140px]">Parceiro</TableHead>
                    <TableHead className="min-w-[140px]">Centro Custo</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Select value={line.account_id} onValueChange={(v) => updateLine(idx, "account_id", v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Conta..." />
                          </SelectTrigger>
                          <SelectContent>
                            {analyticalAccounts.map((a) => (
                              <SelectItem key={a.id} value={a.id} className="text-xs">
                                {a.code} - {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8 text-xs text-right"
                          value={line.debit_amount}
                          onChange={(e) => updateLine(idx, "debit_amount", e.target.value)}
                          placeholder="0,00"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8 text-xs text-right"
                          value={line.credit_amount}
                          onChange={(e) => updateLine(idx, "credit_amount", e.target.value)}
                          placeholder="0,00"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-xs"
                          value={line.description}
                          onChange={(e) => updateLine(idx, "description", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={line.partner_id} onValueChange={(v) => updateLine(idx, "partner_id", v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {(partners || []).map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={line.cost_center_id} onValueChange={(v) => updateLine(idx, "cost_center_id", v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {(costCenters || []).map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {lines.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-6 text-sm">
              <span>
                Débito: <strong className="text-primary">{formatCurrency(totalDebit)}</strong>
              </span>
              <span>
                Crédito: <strong className="text-primary">{formatCurrency(totalCredit)}</strong>
              </span>
              <span className={diff > 0.01 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                Diferença: {formatCurrency(diff)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!canSave || createEntry.isPending}>
              {createEntry.isPending ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
