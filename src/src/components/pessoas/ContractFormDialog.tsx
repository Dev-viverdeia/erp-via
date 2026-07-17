import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateEmployeeContract, useUpdateEmployeeContract, type EmployeeContract } from "@/hooks/useEmployeeContracts";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  contract_type: z.enum(["pj", "clt"]),
  start_date: z.string().min(1, "Data início é obrigatória"),
  end_date: z.string().optional().or(z.literal("")),
  monthly_value: z.string().min(1, "Valor mensal é obrigatório"),
  description: z.string().max(1000).optional().or(z.literal("")),
  status: z.enum(["active", "ended"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  contract?: EmployeeContract | null;
}

export function ContractFormDialog({ open, onOpenChange, employeeId, contract }: Props) {
  const create = useCreateEmployeeContract();
  const update = useUpdateEmployeeContract();
  const isEditing = !!contract;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_type: "pj", start_date: "", end_date: "",
      monthly_value: "", description: "", status: "active",
    },
  });

  useEffect(() => {
    if (contract) {
      form.reset({
        contract_type: contract.contract_type as "pj" | "clt",
        start_date: contract.start_date,
        end_date: contract.end_date ?? "",
        monthly_value: contract.monthly_value.toString(),
        description: contract.description ?? "",
        status: contract.status as "active" | "ended",
      });
    } else {
      form.reset({
        contract_type: "pj", start_date: "", end_date: "",
        monthly_value: "", description: "", status: "active",
      });
    }
  }, [contract, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        contract_type: values.contract_type,
        start_date: values.start_date,
        end_date: values.end_date || null,
        monthly_value: parseFloat(values.monthly_value),
        description: values.description || null,
        status: values.status,
      };

      if (isEditing) {
        await update.mutateAsync({ id: contract.id, ...payload });
        toast({ title: "Contrato atualizado" });
      } else {
        await create.mutateAsync({ ...payload, employee_id: employeeId });
        toast({ title: "Contrato criado" });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao salvar contrato", variant: "destructive" });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          <DialogDescription>{isEditing ? "Atualize os dados do contrato." : "Preencha os dados do novo contrato."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="contract_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="clt">CLT</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data início *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data fim</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="monthly_value" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor mensal (R$) *</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="ended">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar Contrato"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
