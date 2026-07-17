import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useReverseJournalEntry, type JournalEntry } from "@/hooks/useJournalEntries";

interface Props {
  entry: JournalEntry | null;
  onClose: () => void;
}

export function JournalEntryDetailPanel({ entry, onClose }: Props) {
  const reverseMutation = useReverseJournalEntry();

  if (!entry) return null;

  const totalDebit = entry.journal_entry_lines.reduce((s, l) => s + Number(l.debit_amount), 0);
  const totalCredit = entry.journal_entry_lines.reduce((s, l) => s + Number(l.credit_amount), 0);

  return (
    <Sheet open={!!entry} onOpenChange={() => onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhe do Lançamento</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data</span>
              <p className="font-medium">{formatDate(entry.entry_date)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo</span>
              <p>
                <Badge variant={entry.is_automatic ? "secondary" : "outline"}>
                  {entry.is_automatic ? "Automático" : "Manual"}
                </Badge>
                {entry.is_reversed && (
                  <Badge variant="destructive" className="ml-2">
                    Estornado
                  </Badge>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Descrição</span>
              <p className="font-medium">{entry.description}</p>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Débito</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.journal_entry_lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-xs">
                      {line.chart_of_accounts
                        ? `${line.chart_of_accounts.code} - ${line.chart_of_accounts.name}`
                        : line.account_id}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {Number(line.debit_amount) > 0 ? formatCurrency(Number(line.debit_amount)) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {Number(line.credit_amount) > 0 ? formatCurrency(Number(line.credit_amount)) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{line.description || "—"}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {!entry.is_reversed && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  reverseMutation.mutate(entry, { onSuccess: onClose });
                }}
                disabled={reverseMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {reverseMutation.isPending ? "Estornando..." : "Estornar Lançamento"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
