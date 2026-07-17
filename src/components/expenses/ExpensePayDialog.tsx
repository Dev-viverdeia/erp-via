import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { usePayExpense } from "@/hooks/useExpenses";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
  expenseDescription: string;
}

export function ExpensePayDialog({ open, onOpenChange, expenseId, expenseDescription }: Props) {
  const [bankAccountId, setBankAccountId] = useState("");
  const [paidDate, setPaidDate] = useState<Date>(new Date());
  const { data: accounts = [] } = useBankAccounts();
  const payExpense = usePayExpense();

  const handlePay = () => {
    if (!expenseId || !bankAccountId) return;
    payExpense.mutate(
      { id: expenseId, bank_account_id: bankAccountId, paid_date: format(paidDate, "yyyy-MM-dd") },
      {
        onSuccess: () => {
          toast.success("Pagamento registrado com sucesso");
          onOpenChange(false);
          setBankAccountId("");
          setPaidDate(new Date());
        },
        onError: () => toast.error("Erro ao registrar pagamento"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>Confirme o pagamento da despesa "{expenseDescription}".</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Conta Bancária *</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.bank_name} — {a.account_number || "S/N"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Pagamento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !paidDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paidDate ? format(paidDate, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={paidDate} onSelect={(d) => d && setPaidDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handlePay} disabled={!bankAccountId || payExpense.isPending}>
            {payExpense.isPending ? "Pagando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
