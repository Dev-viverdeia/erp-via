import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeactivateBankAccount, type BankAccount } from "@/hooks/useBankAccounts";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccount | null;
}

export function BankAccountDeleteDialog({ open, onOpenChange, account }: Props) {
  const deactivate = useDeactivateBankAccount();

  const handleDeactivate = async () => {
    if (!account) return;
    try {
      await deactivate.mutateAsync(account.id);
      toast({ title: "Conta desativada com sucesso" });
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao desativar conta", variant: "destructive" });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar conta</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja desativar a conta <strong>{account?.bank_name}</strong>? Ela não aparecerá mais nas listagens.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeactivate} disabled={deactivate.isPending}>
            {deactivate.isPending ? "Desativando..." : "Desativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
