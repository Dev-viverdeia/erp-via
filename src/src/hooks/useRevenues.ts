import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { addMonths, format } from "date-fns";
import { createRevenueProvisioningJournalEntry, createRevenueInstallmentJournalEntry } from "./useAutoJournalEntry";

export type Revenue = Tables<"revenues"> & {
  partners: { name: string } | null;
};

export function useRevenues(search?: string, statusFilter?: string, paymentTypeFilter?: string) {
  return useQuery({
    queryKey: ["revenues", search, statusFilter, paymentTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("revenues")
        .select("*, partners(name)")
        .is("deleted_at", null)
        .order("contracted_at", { ascending: false });

      if (search) {
        query = query.ilike("partners.name", `%${search}%`);
      }
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (paymentTypeFilter && paymentTypeFilter !== "all") {
        query = query.eq("payment_type", paymentTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Revenue[]).filter((r) => {
        if (!search) return true;
        return r.partners?.name?.toLowerCase().includes(search.toLowerCase());
      });
    },
  });
}

export function useCreateRevenue() {
  const queryClient = useQueryClient();
  const { data: companyId } = useCompanyId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      partner_id: string;
      total_amount: number;
      payment_type: string;
      gateway?: string | null;
      gateway_ref?: string | null;
      contracted_at: string;
      notes?: string | null;
    }) => {
      const isRecurring = input.payment_type === "recurring";
      const installmentsCount = isRecurring ? 12 : 1;
      const contractedDate = new Date(input.contracted_at);

      // 1. Create revenue
      const { data: revenue, error } = await supabase
        .from("revenues")
        .insert({
          company_id: companyId!,
          created_by: user!.id,
          partner_id: input.partner_id,
          total_amount: input.total_amount,
          payment_type: input.payment_type,
          gateway: input.gateway || null,
          gateway_ref: input.gateway_ref || null,
          contracted_at: input.contracted_at,
          notes: input.notes || null,
          installments_count: installmentsCount,
          status: isRecurring ? "active" : "completed",
          expires_at: isRecurring
            ? addMonths(contractedDate, 12).toISOString()
            : null,
        })
        .select()
        .single();
      if (error) throw error;

      // 2. Generate installments
      const installmentAmount = isRecurring
        ? Math.round((input.total_amount / 12) * 100) / 100
        : input.total_amount;

      const installments = [];
      for (let i = 1; i <= installmentsCount; i++) {
        const isLast = i === 12 && isRecurring;
        const amount = isLast
          ? input.total_amount - installmentAmount * 11
          : installmentAmount;
        const dueDate = format(addMonths(contractedDate, i - 1), "yyyy-MM-dd");
        const isPaid = i === 1;

        installments.push({
          revenue_id: revenue.id,
          installment_number: i,
          amount,
          due_date: dueDate,
          status: isPaid ? "paid" : "provisioned",
          paid_date: isPaid ? dueDate : null,
          paid_amount: isPaid ? amount : null,
        });
      }

      const { error: instError } = await supabase
        .from("revenue_installments")
        .insert(installments);
      if (instError) throw instError;

      // Auto journal entries
      if (companyId) {
        try {
          if (isRecurring) {
            // Provision full amount: D-Contas a Receber / C-Receita Diferida
            await createRevenueProvisioningJournalEntry(
              companyId, input.total_amount, format(contractedDate, "yyyy-MM-dd"), revenue.id
            );
            // First installment is paid - realize it
            await createRevenueInstallmentJournalEntry(
              companyId, installmentAmount, format(contractedDate, "yyyy-MM-dd"), revenue.id, true
            );
          } else {
            // Cash: D-Banco / C-Receita
            await createRevenueInstallmentJournalEntry(
              companyId, input.total_amount, format(contractedDate, "yyyy-MM-dd"), revenue.id, false
            );
          }
        } catch (e) {
          console.warn("Auto journal entry failed:", e);
        }
      }

      return revenue;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revenues"] }),
  });
}

export function useUpdateRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      gateway_ref?: string | null;
      notes?: string | null;
      gateway?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("revenues")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revenues"] }),
  });
}

export function useDeleteRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("revenues")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revenues"] }),
  });
}

export function useCancelRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Cancel revenue
      const { error } = await supabase
        .from("revenues")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;

      // Cancel pending installments
      const { error: instError } = await supabase
        .from("revenue_installments")
        .update({ status: "cancelled" })
        .eq("revenue_id", id)
        .in("status", ["provisioned", "overdue"]);
      if (instError) throw instError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revenues"] }),
  });
}
