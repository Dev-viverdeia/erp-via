import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePartner, type Partner } from "@/hooks/usePartners";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
}

export function PartnerDeleteDialog({ open, onOpenChange, partner }: Props) {
  const deleteMutation = useDeletePartner();

  const handleDelete = async () => {
    if (!partner) return;
    try {
      await deleteMutation.mutateAsync(partner.id);
      toast({ title: "Parceiro excluído com sucesso" });
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao excluir parceiro", variant: "destructive" });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir parceiro</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{partner?.name}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
