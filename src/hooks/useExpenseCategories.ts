import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from "sonner";

export type ExpenseCategory = Tables<"expense_categories">;

export function useExpenseCategories(includeInactive = false) {
  return useQuery({
    queryKey: ["expense-categories", includeInactive],
    queryFn: async () => {
      let query = supabase.from("expense_categories").select("*").order("name");
      if (!includeInactive) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("expense_categories")
        .insert({ name, company_id: companyId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Categoria criada");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });
}

export function useUpdateExpenseCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; is_active?: boolean }) => {
      const { error } = await supabase.from("expense_categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Categoria atualizada");
    },
    onError: () => toast.error("Erro ao atualizar categoria"),
  });
}
