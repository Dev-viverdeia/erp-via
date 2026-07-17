import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SystemEntry = {
  id: string;
  source: "installment" | "expense";
  date: string;
  description: string;
  partnerName: string | null;
  amount: number;
  type: "credit" | "debit";
};

export function usePendingSystemEntries() {
  return useQuery({
    queryKey: ["pending-system-entries"],
    queryFn: async () => {
      const entries: SystemEntry[] = [];

      // 1. Revenue installments (provisioned = pending receivables → will become credits)
      const { data: installments, error: instErr } = await supabase
        .from("revenue_installments")
        .select("id, amount, due_date, installment_number, revenue_id, revenues!inner(partner_id, deleted_at, partners(name))")
        .in("status", ["provisioned", "pending"])
        .is("revenues.deleted_at", null)
        .order("due_date");
      if (instErr) throw instErr;

      for (const inst of installments ?? []) {
        const rev = inst.revenues as { partner_id: string | null; partners: { name: string } | null };
        entries.push({
          id: inst.id,
          source: "installment",
          date: inst.due_date,
          description: `Parcela #${inst.installment_number}`,
          partnerName: rev?.partners?.name ?? null,
          amount: inst.amount,
          type: "credit",
        });
      }

      // 2. Expenses (pending = payables → will become debits)
      const { data: expenses, error: expErr } = await supabase
        .from("expenses")
        .select("id, amount, due_date, description, partners(name)")
        .eq("status", "pending")
        .is("deleted_at", null)
        .order("due_date");
      if (expErr) throw expErr;

      for (const exp of expenses ?? []) {
        entries.push({
          id: exp.id,
          source: "expense",
          date: exp.due_date,
          description: exp.description,
          partnerName: (exp.partners as { name: string } | null)?.name ?? null,
          amount: exp.amount,
          type: "debit",
        });
      }

      return entries;
    },
  });
}
