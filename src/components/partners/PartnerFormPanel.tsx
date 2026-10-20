import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePartner, useUpdatePartner, type Partner } from "@/hooks/usePartners";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  type: z.enum(["customer", "vendor", "both"]),
  document: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  defaultType?: FormValues["type"];
}

export function PartnerFormPanel({ open, onOpenChange, partner, defaultType = "customer" }: Props) {
  const create = useCreatePartner();
  const update = useUpdatePartner();
  const isEditing = !!partner;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: defaultType, document: "", email: "", phone: "", notes: "" },
  });

  useEffect(() => {
    if (partner) {
      form.reset({
        name: partner.name,
        type: partner.type as FormValues["type"],
        document: partner.document ?? "",
        email: partner.email ?? "",
        phone: partner.phone ?? "",
        notes: partner.notes ?? "",
      });
    } else {
      form.reset({ name: "", type: defaultType, document: "", email: "", phone: "", notes: "" });
    }
  }, [partner, open, defaultType, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        name: values.name,
        type: values.type,
        document: values.document || null,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
      };

      if (isEditing) {
        await update.mutateAsync({ id: partner.id, ...payload });
        toast({ title: "Parceiro atualizado com sucesso" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Parceiro criado com sucesso" });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao salvar parceiro", variant: "destructive" });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Parceiro" : "Novo Parceiro"}</SheetTitle>
          <SheetDescription>{isEditing ? "Atualize os dados do parceiro." : "Preencha os dados para criar um novo parceiro."}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="vendor">Fornecedor</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="document" render={({ field }) => (
              <FormItem>
                <FormLabel>Documento (CPF/CNPJ)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl><Input {...field} /></FormControl>
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar Parceiro"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
