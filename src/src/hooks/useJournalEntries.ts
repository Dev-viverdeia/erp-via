import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "./useCompanyId";
import { toast } from "sonner";

export interface JournalEntryLine {
  id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string | null;
  partner_id: string | null;
  cost_center_id: string | null;
  chart_of_accounts?: { code: string; name: string } | null;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_date: string;
  description: string;
  is_automatic: boolean;
  is_reversed: boolean;
  reversed_by: string | null;
  reference_type: string | null;
  reference_id: string | null;
  fiscal_period_id: string | null;
  created_by: string | null;
  created_at: string;
  journal_entry_lines: JournalEntryLine[];
}

export function useJournalEntries(startDate?: string, endDate?: string, search?: string) {
  const { data: companyId } = useCompanyId();

  return useQuery({
    queryKey: ["journal-entries", companyId, startDate, endDate, search],
    queryFn: async () => {
      let query = supabase
        .from("journal_entries")
        .select("*, journal_entry_lines(*, chart_of_accounts(code, name))")
        .eq("company_id", companyId!)
        .order("entry_date", { ascending: false });

      if (startDate) query = query.gte("entry_date", startDate);
      if (endDate) query = query.lte("entry_date", endDate);
      if (search) query = query.ilike("description", `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as JournalEntry[];
    },
    enabled: !!companyId,
  });
}

export interface CreateJournalEntryInput {
  entry_date: string;
  description: string;
  lines: {
    account_id: string;
    debit_amount: number;
    credit_amount: number;
    description?: string;
    partner_id?: string;
    cost_center_id?: string;
  }[];
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (input: CreateJournalEntryInput) => {
      const { data, error } = await supabase.rpc("fn_create_journal_entry", {
        p_company_id: companyId!,
        p_entry_date: input.entry_date,
        p_description: input.description,
        p_lines: JSON.stringify(input.lines),
      } as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Lançamento criado com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReverseJournalEntry() {
  const qc = useQueryClient();
  const { data: companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (entry: JournalEntry) => {
      const reversedLines = entry.journal_entry_lines.map((l) => ({
        account_id: l.account_id,
        debit_amount: l.credit_amount,
        credit_amount: l.debit_amount,
        description: `Estorno: ${l.description || ""}`.trim(),
        partner_id: l.partner_id || "",
        cost_center_id: l.cost_center_id || "",
      }));

      const { data: newId, error: createError } = await supabase.rpc("fn_create_journal_entry", {
        p_company_id: companyId!,
        p_entry_date: new Date().toISOString().split("T")[0],
        p_description: `Estorno: ${entry.description}`,
        p_lines: JSON.stringify(reversedLines),
      } as any);
      if (createError) throw createError;

      // Mark original as reversed
      await supabase
        .from("journal_entries")
        .update({ is_reversed: true, reversed_by: newId as string })
        .eq("id", entry.id);

      return newId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Lançamento estornado com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
