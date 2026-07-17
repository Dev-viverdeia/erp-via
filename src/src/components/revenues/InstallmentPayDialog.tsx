import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { usePayInstallment } from "@/hooks/useRevenueInstallments";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment: { id: string; amount: number; installment_number: number } | null;
}

export function InstallmentPayDialog({ open, onOpenChange, installment }: Props) {
  const { data: accounts = [] } = useBankAccounts();
  const payInstallment = usePayInstallment();
  const [bankAccountId, setBankAccountId] = useState("");
  const [paidDate, setPaidDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleConfirm = async () => {
    if (!installment || !bankAccountId) {
      toast.error("Selecione a conta bancária.");
      return;
    }
    try {
      await payInstallment.mutateAsync({
        id: installment.id,
        bank_account_id: bankAccountId,
        paid_date: paidDate,
        paid_amount: installment.amount,
      });
      toast.success(`Parcela ${installment.installment_number} registrada como paga.`);
      onOpenChange(false);
      setBankAccountId("");
    } catch {
      toast.error("Erro ao dar baixa na parcela.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar baixa na parcela {installment?.installment_number}</DialogTitle>
          <DialogDescription>
            Valor: {installment ? formatCurrency(installment.amount) : "—"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Conta Bancária *</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.bank_name} — {a.account_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data do Pagamento *</Label>
            <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={payInstallment.isPending}>
            {payInstallment.isPending ? "Salvando..." : "Confirmar Baixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
