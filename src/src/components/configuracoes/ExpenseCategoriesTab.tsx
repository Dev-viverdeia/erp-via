import { useState } from "react";
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, type ExpenseCategory } from "@/hooks/useExpenseCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ExpenseCategoriesTab() {
  const { data: categories, isLoading } = useExpenseCategories(true);
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [name, setName] = useState("");

  const openCreate = () => { setEditing(null); setName(""); setDialogOpen(true); };
  const openEdit = (cat: ExpenseCategory) => { setEditing(cat); setName(cat.name); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, name: name.trim() });
    } else {
      await createMutation.mutateAsync(name.trim());
    }
    setDialogOpen(false);
  };

  const toggleActive = (cat: ExpenseCategory) => {
    updateMutation.mutate({ id: cat.id, is_active: !cat.is_active });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="space-y-2 pt-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-heading text-foreground">Categorias de Despesa</h2>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Categoria</Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-24 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!categories || categories.length === 0) ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Nenhuma categoria cadastrada.</TableCell></TableRow>
            ) : categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={cat.is_active ? "default" : "secondary"}>{cat.is_active ? "Ativa" : "Inativa"}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                    <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>{editing ? "Altere o nome da categoria." : "Informe o nome da nova categoria de despesa."}</DialogDescription>
          </DialogHeader>
          <Input placeholder="Nome da categoria" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim() || isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
