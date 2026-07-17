import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAccount, type Account } from "@/hooks/useChartOfAccounts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string;
  accounts: Account[];
}

export function AccountFormDialog({ open, onOpenChange, parentId, accounts }: Props) {
  const createAccount = useCreateAccount();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [selectedParent, setSelectedParent] = useState(parentId || "");

  const syntheticAccounts = accounts.filter((a) => !a.is_analytical);
  const parent = accounts.find((a) => a.id === (selectedParent || parentId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = selectedParent || parentId;
    if (!pid || !code || !name) return;

    createAccount.mutate(
      {
        code,
        name,
        parent_id: pid,
        type: parent?.type || "asset",
        nature: parent?.nature || "debit",
        is_analytical: true,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCode("");
          setName("");
          setSelectedParent("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conta Analítica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Conta Pai</Label>
            <Select value={selectedParent || parentId || ""} onValueChange={setSelectedParent}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {syntheticAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Código</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: 1.1.7" required />
          </div>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da conta" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAccount.isPending || !code || !name}>
              {createAccount.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
