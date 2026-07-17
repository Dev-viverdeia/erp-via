import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteExpense } from "@/hooks/useExpenses";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
  expenseDescription: string;
}

export function ExpenseDeleteDialog({ open, onOpenChange, expenseId, expenseDescription }: Props) {
  const deleteExpense = useDeleteExpense();

  const handleDelete = () => {
    if (!expenseId) return;
    deleteExpense.mutate(expenseId, {
      onSuccess: () => { toast.success("Despesa excluída com sucesso"); onOpenChange(false); },
      onError: () => toast.error("Erro ao excluir despesa"),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir despesa</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a despesa <strong>"{expenseDescription}"</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
