import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { createExpenseJournalEntry } from "./useAutoJournalEntry";

export type Expense = Tables<"expenses"> & {
  partners: { name: string } | null;
  expense_categories: { name: string } | null;
  cost_centers: { name: string } | null;
};

export function useExpenses(search?: string, statusFilter?: string, categoryFilter?: string) {
  return useQuery({
    queryKey: ["expenses", search, statusFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select("*, partners(name), expense_categories(name), cost_centers(name)")
        .is("deleted_at", null)
        .order("due_date", { ascending: false });

      if (search) {
        query = query.ilike("description", `%${search}%`);
      }
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (categoryFilter && categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: {
      description: string;
      amount: number;
      due_date: string;
      partner_id?: string | null;
      category_id?: string | null;
      cost_center_id?: string | null;
      bank_account_id?: string | null;
      pis_cofins_credit?: boolean;
      is_recurring?: boolean;
      recurrence_interval?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expense,
          company_id: companyId!,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      description?: string;
      amount?: number;
      due_date?: string;
      partner_id?: string | null;
      category_id?: string | null;
      cost_center_id?: string | null;
      bank_account_id?: string | null;
      pis_cofins_credit?: boolean;
      is_recurring?: boolean;
      recurrence_interval?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function usePayExpense() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, bank_account_id, paid_date }: {
      id: string;
      bank_account_id: string;
      paid_date: string;
    }) => {
      // Mark as paid
      const { error } = await supabase
        .from("expenses")
        .update({ status: "paid", paid_date, bank_account_id })
        .eq("id", id);
      if (error) throw error;

      // Fetch expense for journal entry
      const { data: expForJE } = await supabase
        .from("expenses")
        .select("*, expense_categories(account_id, chart_of_accounts:account_id(code))")
        .eq("id", id)
        .single();

      if (companyId && expForJE) {
        const catCode = (expForJE as any).expense_categories?.chart_of_accounts?.code;
        try {
          await createExpenseJournalEntry(companyId, expForJE.description, expForJE.amount, paid_date, id, catCode);
        } catch (e) {
          console.warn("Auto journal entry failed:", e);
        }
      }

      // Check if recurring — generate next occurrence
      const { data: expense } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();

      if (expense?.is_recurring && expense.recurrence_interval && companyId) {
        const currentDue = new Date(expense.due_date);
        let nextDue: Date;

        switch (expense.recurrence_interval) {
          case "monthly":
            nextDue = new Date(currentDue);
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case "quarterly":
            nextDue = new Date(currentDue);
            nextDue.setMonth(nextDue.getMonth() + 3);
            break;
          case "yearly":
            nextDue = new Date(currentDue);
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
          default:
            nextDue = new Date(currentDue);
            nextDue.setMonth(nextDue.getMonth() + 1);
        }

        await supabase.from("expenses").insert({
          company_id: companyId,
          description: expense.description,
          amount: expense.amount,
          due_date: nextDue.toISOString().split("T")[0],
          partner_id: expense.partner_id,
          category_id: expense.category_id,
          cost_center_id: expense.cost_center_id,
          pis_cofins_credit: expense.pis_cofins_credit,
          is_recurring: true,
          recurrence_interval: expense.recurrence_interval,
          notes: expense.notes,
          status: "pending",
          created_by: user?.id || null,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
