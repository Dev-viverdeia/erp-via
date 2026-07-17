import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateEmployee, useUpdateEmployee, type Employee } from "@/hooks/useEmployees";
import { usePartners } from "@/hooks/usePartners";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  partner_id: z.string().min(1, "Parceiro é obrigatório"),
  contract_type: z.enum(["pj", "clt"]),
  role: z.string().max(200).optional().or(z.literal("")),
  department: z.string().max(200).optional().or(z.literal("")),
  salary: z.string().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  bank_agency: z.string().optional().or(z.literal("")),
  bank_account: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

export function EmployeeFormPanel({ open, onOpenChange, employee }: Props) {
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const isEditing = !!employee;
  const { data: partners = [] } = usePartners(undefined, undefined);

  const vendorPartners = partners.filter((p) => p.type === "vendor" || p.type === "both");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      partner_id: "", contract_type: "pj", role: "", department: "",
      salary: "", start_date: "", end_date: "",
      bank_name: "", bank_agency: "", bank_account: "",
    },
  });

  useEffect(() => {
    if (employee) {
      const bi = employee.bank_info as Record<string, string> | null;
      form.reset({
        partner_id: employee.partner_id ?? "",
        contract_type: employee.contract_type as "pj" | "clt",
        role: employee.role ?? "",
        department: employee.department ?? "",
        salary: employee.salary?.toString() ?? "",
        start_date: employee.start_date ?? "",
        end_date: employee.end_date ?? "",
        bank_name: bi?.banco ?? "",
        bank_agency: bi?.agencia ?? "",
        bank_account: bi?.conta ?? "",
      });
    } else {
      form.reset({
        partner_id: "", contract_type: "pj", role: "", department: "",
        salary: "", start_date: "", end_date: "",
        bank_name: "", bank_agency: "", bank_account: "",
      });
    }
  }, [employee, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        partner_id: values.partner_id || null,
        contract_type: values.contract_type,
        role: values.role || null,
        department: values.department || null,
        salary: values.salary ? parseFloat(values.salary) : null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        bank_info: {
          banco: values.bank_name || "",
          agencia: values.bank_agency || "",
          conta: values.bank_account || "",
        },
      };

      if (isEditing) {
        await update.mutateAsync({ id: employee.id, ...payload });
        toast({ title: "Funcionário atualizado com sucesso" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Funcionário criado com sucesso" });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao salvar funcionário", variant: "destructive" });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Funcionário" : "Novo Funcionário"}</SheetTitle>
          <SheetDescription>{isEditing ? "Atualize os dados do funcionário." : "Preencha os dados para cadastrar."}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField control={form.control} name="partner_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Parceiro vinculado *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {vendorPartners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contract_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de contrato *</FormLabel>
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
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="department" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="salary" render={({ field }) => (
              <FormItem>
                <FormLabel>Salário (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data início</FormLabel>
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
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Dados bancários</p>
              <FormField control={form.control} name="bank_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="bank_agency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="bank_account" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
