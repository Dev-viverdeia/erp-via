import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCancelRevenue } from "@/hooks/useRevenues";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenueId: string | null;
}

export function RevenueCancelDialog({ open, onOpenChange, revenueId }: Props) {
  const cancelRevenue = useCancelRevenue();

  const handleConfirm = async () => {
    if (!revenueId) return;
    try {
      await cancelRevenue.mutateAsync(revenueId);
      toast.success("Receita cancelada com sucesso.");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao cancelar receita.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar receita?</AlertDialogTitle>
          <AlertDialogDescription>
            A receita será marcada como cancelada e todas as parcelas pendentes serão canceladas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Cancelar Receita
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
