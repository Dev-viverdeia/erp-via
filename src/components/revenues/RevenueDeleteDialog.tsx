import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteRevenue } from "@/hooks/useRevenues";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenueId: string | null;
}

export function RevenueDeleteDialog({ open, onOpenChange, revenueId }: Props) {
  const deleteRevenue = useDeleteRevenue();

  const handleConfirm = async () => {
    if (!revenueId) return;
    try {
      await deleteRevenue.mutateAsync(revenueId);
      toast.success("Receita excluída com sucesso.");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao excluir receita.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A receita será removida da listagem.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
