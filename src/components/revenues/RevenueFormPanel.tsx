import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePartners } from "@/hooks/usePartners";
import { useCreateRevenue, useUpdateRevenue, type Revenue } from "@/hooks/useRevenues";
import { toast } from "sonner";
import { format } from "date-fns";

const schema = z.object({
  partner_id: z.string().min(1, "Selecione um cliente"),
  total_amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  payment_type: z.enum(["pix", "card", "recurring"]),
  gateway: z.string().optional(),
  gateway_ref: z.string().optional(),
  contracted_at: z.string().min(1, "Data obrigatória"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: Revenue | null;
}

export function RevenueFormPanel({ open, onOpenChange, revenue }: Props) {
  const { data: partners = [] } = usePartners(undefined, undefined);
  const createRevenue = useCreateRevenue();
  const updateRevenue = useUpdateRevenue();
  const isEditing = !!revenue;

  const customers = partners.filter((p) => p.type === "customer" || p.type === "both");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      partner_id: "",
      total_amount: 0,
      payment_type: "pix",
      gateway: "",
      gateway_ref: "",
      contracted_at: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  useEffect(() => {
    if (revenue) {
      form.reset({
        partner_id: revenue.partner_id || "",
        total_amount: revenue.total_amount,
        payment_type: revenue.payment_type as "pix" | "card" | "recurring",
        gateway: revenue.gateway || "",
        gateway_ref: revenue.gateway_ref || "",
        contracted_at: revenue.contracted_at ? format(new Date(revenue.contracted_at), "yyyy-MM-dd") : "",
        notes: revenue.notes || "",
      });
    } else {
      form.reset({
        partner_id: "",
        total_amount: 0,
        payment_type: "pix",
        gateway: "",
        gateway_ref: "",
        contracted_at: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    }
  }, [revenue, open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateRevenue.mutateAsync({
          id: revenue.id,
          gateway: data.gateway || null,
          gateway_ref: data.gateway_ref || null,
          notes: data.notes || null,
        });
        toast.success("Receita atualizada.");
      } else {
        await createRevenue.mutateAsync({
          partner_id: data.partner_id,
          total_amount: data.total_amount,
          payment_type: data.payment_type,
          gateway: data.gateway || null,
          gateway_ref: data.gateway_ref || null,
          contracted_at: new Date(data.contracted_at).toISOString(),
          notes: data.notes || null,
        });
        toast.success("Receita criada com parcelas provisionadas.");
      }
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar receita.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Receita" : "Nova Receita"}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="partner_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {customers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="total_amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Total (R$) *</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" {...field} disabled={isEditing} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="payment_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pagamento *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="card">Cartão à Vista</SelectItem>
                    <SelectItem value="recurring">Recorrente (12x)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gateway" render={({ field }) => (
              <FormItem>
                <FormLabel>Gateway</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="appmax">Appmax</SelectItem>
                    <SelectItem value="hubla">Hubla</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gateway_ref" render={({ field }) => (
              <FormItem>
                <FormLabel>Referência Gateway</FormLabel>
                <FormControl><Input placeholder="ID da transação no gateway" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="contracted_at" render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Contratação *</FormLabel>
                <FormControl><Input type="date" {...field} disabled={isEditing} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={createRevenue.isPending || updateRevenue.isPending}>
                {createRevenue.isPending || updateRevenue.isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Receita"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
