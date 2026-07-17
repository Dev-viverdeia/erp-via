import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBankAccount, useUpdateBankAccount, type BankAccount } from "@/hooks/useBankAccounts";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  bank_name: z.string().trim().min(1, "Nome do banco é obrigatório").max(100),
  agency: z.string().max(10).optional().or(z.literal("")),
  account_number: z.string().max(20).optional().or(z.literal("")),
  account_type: z.enum(["checking", "savings"]),
  initial_balance: z.coerce.number().min(0, "Saldo deve ser >= 0"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount | null;
}

export function BankAccountFormPanel({ open, onOpenChange, account }: Props) {
  const create = useCreateBankAccount();
  const update = useUpdateBankAccount();
  const isEditing = !!account;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bank_name: "", agency: "", account_number: "", account_type: "checking", initial_balance: 0 },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        bank_name: account.bank_name,
        agency: account.agency ?? "",
        account_number: account.account_number ?? "",
        account_type: (account.account_type as "checking" | "savings") ?? "checking",
        initial_balance: account.initial_balance,
      });
    } else {
      form.reset({ bank_name: "", agency: "", account_number: "", account_type: "checking", initial_balance: 0 });
    }
  }, [account, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        bank_name: values.bank_name,
        agency: values.agency || null,
        account_number: values.account_number || null,
        account_type: values.account_type,
        initial_balance: values.initial_balance,
      };

      if (isEditing) {
        await update.mutateAsync({ id: account.id, ...payload });
        toast({ title: "Conta atualizada com sucesso" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Conta criada com sucesso" });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao salvar conta", variant: "destructive" });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Conta" : "Nova Conta Bancária"}</SheetTitle>
          <SheetDescription>{isEditing ? "Atualize os dados da conta." : "Preencha os dados para criar uma nova conta."}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField control={form.control} name="bank_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Banco *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="agency" render={({ field }) => (
              <FormItem>
                <FormLabel>Agência</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="account_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Conta</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="account_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="checking">Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="initial_balance" render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Inicial (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar Conta"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
