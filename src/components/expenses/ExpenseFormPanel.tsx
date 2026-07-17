import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateExpense, useUpdateExpense, type Expense } from "@/hooks/useExpenses";
import { usePartners } from "@/hooks/usePartners";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useCostCenters } from "@/hooks/useCostCenters";
import { toast } from "sonner";

const schema = z.object({
  description: z.string().min(1, "Descrição obrigatória").max(500),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  due_date: z.date({ required_error: "Vencimento obrigatório" }),
  partner_id: z.string().optional().or(z.literal("")),
  category_id: z.string().optional().or(z.literal("")),
  cost_center_id: z.string().optional().or(z.literal("")),
  pis_cofins_credit: z.boolean(),
  is_recurring: z.boolean(),
  recurrence_interval: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export function ExpenseFormPanel({ open, onOpenChange, expense }: Props) {
  const isEditing = !!expense;
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { data: partners = [] } = usePartners(undefined, undefined);
  const { data: categories = [] } = useExpenseCategories();
  const { data: costCenters = [] } = useCostCenters();

  const vendorPartners = partners.filter((p) => p.type === "vendor" || p.type === "both");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "", amount: 0, partner_id: "", category_id: "", cost_center_id: "",
      pis_cofins_credit: false, is_recurring: false, recurrence_interval: "", notes: "",
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        due_date: new Date(expense.due_date + "T12:00:00"),
        partner_id: expense.partner_id ?? "",
        category_id: expense.category_id ?? "",
        cost_center_id: expense.cost_center_id ?? "",
        pis_cofins_credit: expense.pis_cofins_credit,
        is_recurring: expense.is_recurring,
        recurrence_interval: expense.recurrence_interval ?? "",
        notes: expense.notes ?? "",
      });
    } else {
      form.reset({
        description: "", amount: 0, partner_id: "", category_id: "", cost_center_id: "",
        pis_cofins_credit: false, is_recurring: false, recurrence_interval: "", notes: "",
      });
    }
  }, [expense, open, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      description: values.description,
      amount: values.amount,
      due_date: format(values.due_date, "yyyy-MM-dd"),
      partner_id: values.partner_id || null,
      category_id: values.category_id || null,
      cost_center_id: values.cost_center_id || null,
      pis_cofins_credit: values.pis_cofins_credit,
      is_recurring: values.is_recurring,
      recurrence_interval: values.is_recurring ? values.recurrence_interval || null : null,
      notes: values.notes || null,
    };

    const mutation = isEditing
      ? updateExpense.mutateAsync({ id: expense!.id, ...payload })
      : createExpense.mutateAsync(payload);

    mutation
      .then(() => { toast.success(isEditing ? "Despesa atualizada" : "Despesa criada"); onOpenChange(false); })
      .catch(() => toast.error("Erro ao salvar despesa"));
  };

  const isRecurring = form.watch("is_recurring");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Despesa" : "Nova Despesa"}</SheetTitle>
          <SheetDescription>{isEditing ? "Atualize os dados da despesa." : "Preencha os dados da nova despesa."}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição *</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Aluguel escritório" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$) *</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="due_date" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Vencimento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="partner_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Parceiro (Fornecedor)</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {vendorPartners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="cost_center_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Custo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="pis_cofins_credit" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Crédito PIS/COFINS</FormLabel>
              </FormItem>
            )} />

            <FormField control={form.control} name="is_recurring" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Despesa recorrente</FormLabel>
              </FormItem>
            )} />

            {isRecurring && (
              <FormField control={form.control} name="recurrence_interval" render={({ field }) => (
                <FormItem>
                  <FormLabel>Intervalo de Recorrência</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl><Textarea rows={3} {...field} placeholder="Observações opcionais" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={createExpense.isPending || updateExpense.isPending}>
                {(createExpense.isPending || updateExpense.isPending) ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
