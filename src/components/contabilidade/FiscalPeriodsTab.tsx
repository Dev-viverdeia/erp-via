import { useState } from "react";
import { useFiscalPeriods, useCreateFiscalPeriod, useCloseFiscalPeriod, useReopenFiscalPeriod } from "@/hooks/useFiscalPeriods";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Lock, Unlock } from "lucide-react";
import { formatDate } from "@/lib/format";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function FiscalPeriodsTab() {
  const { data: periods, isLoading } = useFiscalPeriods();
  const createPeriod = useCreateFiscalPeriod();
  const closePeriod = useCloseFiscalPeriod();
  const reopenPeriod = useReopenFiscalPeriod();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newMonth, setNewMonth] = useState(String(new Date().getMonth() + 1));
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "close" | "reopen" } | null>(null);

  const handleCreate = () => {
    createPeriod.mutate(
      { year: parseInt(newYear), month: parseInt(newMonth) },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.action === "close") {
      closePeriod.mutate(confirmAction.id, { onSuccess: () => setConfirmAction(null) });
    } else {
      reopenPeriod.mutate(confirmAction.id, { onSuccess: () => setConfirmAction(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Período
        </Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fechado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!periods || periods.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhum período fiscal cadastrado
                </TableCell>
              </TableRow>
            )}
            {(periods || []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.year}</TableCell>
                <TableCell>{monthNames[p.month - 1]}</TableCell>
                <TableCell className="text-xs">{formatDate(p.start_date)}</TableCell>
                <TableCell className="text-xs">{formatDate(p.end_date)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "open" ? "default" : p.status === "closed" ? "secondary" : "outline"}>
                    {p.status === "open" ? "Aberto" : p.status === "closed" ? "Fechado" : p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.closed_at ? formatDate(p.closed_at) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {p.status === "open" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmAction({ id: p.id, action: "close" })}
                    >
                      <Lock className="h-3 w-3 mr-1" /> Fechar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmAction({ id: p.id, action: "reopen" })}
                    >
                      <Unlock className="h-3 w-3 mr-1" /> Reabrir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Período Fiscal</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4">
            <Select value={newMonth} onValueChange={setNewMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newYear} onValueChange={setNewYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createPeriod.isPending}>
              {createPeriod.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "close" ? "Fechar Período Fiscal?" : "Reabrir Período Fiscal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "close"
                ? "Após fechar, novos lançamentos não poderão ser inseridos neste período."
                : "Reabrir permitirá novos lançamentos neste período."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
