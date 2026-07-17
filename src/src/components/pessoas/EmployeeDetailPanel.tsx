import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil } from "lucide-react";
import { type Employee } from "@/hooks/useEmployees";
import { useEmployeeContracts, type EmployeeContract } from "@/hooks/useEmployeeContracts";
import { ContractFormDialog } from "./ContractFormDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function EmployeeDetailPanel({ open, onOpenChange, employee }: Props) {
  const { data: contracts = [], isLoading } = useEmployeeContracts(employee?.id);
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<EmployeeContract | null>(null);

  if (!employee) return null;

  const bi = employee.bank_info as Record<string, string> | null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{employee.partners?.name ?? "Funcionário"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo contrato</p>
                <Badge variant="outline">{employee.contract_type.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={employee.is_active ? "default" : "secondary"}>
                  {employee.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              {employee.role && (
                <div>
                  <p className="text-muted-foreground">Cargo</p>
                  <p className="font-medium">{employee.role}</p>
                </div>
              )}
              {employee.department && (
                <div>
                  <p className="text-muted-foreground">Departamento</p>
                  <p className="font-medium">{employee.department}</p>
                </div>
              )}
              {employee.salary != null && (
                <div>
                  <p className="text-muted-foreground">Salário</p>
                  <p className="font-medium">{formatCurrency(employee.salary)}</p>
                </div>
              )}
              {employee.start_date && (
                <div>
                  <p className="text-muted-foreground">Início</p>
                  <p className="font-medium">{formatDate(employee.start_date)}</p>
                </div>
              )}
              {employee.end_date && (
                <div>
                  <p className="text-muted-foreground">Fim</p>
                  <p className="font-medium">{formatDate(employee.end_date)}</p>
                </div>
              )}
            </div>

            {bi && (bi.banco || bi.agencia || bi.conta) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Dados bancários</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {bi.banco && <div><p className="text-muted-foreground">Banco</p><p>{bi.banco}</p></div>}
                    {bi.agencia && <div><p className="text-muted-foreground">Agência</p><p>{bi.agencia}</p></div>}
                    {bi.conta && <div><p className="text-muted-foreground">Conta</p><p>{bi.conta}</p></div>}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <p className="font-medium">Contratos</p>
              <Button size="sm" variant="outline" onClick={() => { setEditingContract(null); setContractFormOpen(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Novo
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => (
                  <div key={c.id} className="border rounded-md p-3 text-sm flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{c.contract_type.toUpperCase()}</Badge>
                        <Badge variant={c.status === "active" ? "default" : "secondary"}>
                          {c.status === "active" ? "Ativo" : "Encerrado"}
                        </Badge>
                      </div>
                      <p className="font-medium">{formatCurrency(c.monthly_value)}/mês</p>
                      <p className="text-muted-foreground">
                        {formatDate(c.start_date)}
                        {c.end_date ? ` — ${formatDate(c.end_date)}` : " — em aberto"}
                      </p>
                      {c.description && <p className="text-muted-foreground mt-1">{c.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingContract(c); setContractFormOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ContractFormDialog
        open={contractFormOpen}
        onOpenChange={setContractFormOpen}
        employeeId={employee.id}
        contract={editingContract}
      />
    </>
  );
}
