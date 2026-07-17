import { useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2 } from "lucide-react";

const schema = z.object({
  partner_id: z.string().min(1, "Selecione um cliente"),
  total_amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  payment_type: z.enum(["pix", "card", "recurring"]),
  gateway: z.string().optional(),
  gateway_ref: z.string().optional(),
  contracted_at: z.string().min(1, "Data obrigatoria"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: Revenue | null;
}

export function RevenueFormDialog({ open, onOpenChange, revenue }: Props) {
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

  const isPending = createRevenue.isPending || updateRevenue.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {isEditing ? "Editar Receita" : "Nova Receita"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEditing
              ? "Edite as informacoes da receita"
              : "Preencha os dados para registrar uma nova receita"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 pb-8">
            <div className="space-y-5">
              {/* Row: Cliente + Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="partner_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[12px] font-medium">Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormLabel className="text-[12px] font-medium">Valor Total (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" className="h-10" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Row: Tipo + Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="payment_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[12px] font-medium">Tipo de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="card">Cartao a Vista</SelectItem>
                        <SelectItem value="recurring">Recorrente (12x)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contracted_at" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[12px] font-medium">Data Contratacao *</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-10" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Row: Gateway + Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="gateway" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[12px] font-medium">Gateway</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormLabel className="text-[12px] font-medium">Ref. Gateway</FormLabel>
                    <FormControl>
                      <Input placeholder="ID da transacao" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Notas */}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-medium">Notas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Observacoes opcionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 rounded-full cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 rounded-full font-semibold cursor-pointer"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  "Salvar Alteracoes"
                ) : (
                  "Criar Receita"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
