import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AgingFaixa {
  faixa: string;
  valor: number;
  count: number;
  tipo: "a_vencer" | "vencida";
}

export function useAgingRecebiveis() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["aging-recebiveis", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_installments")
        .select("amount, due_date, status, revenues!inner(deleted_at)")
        .in("status", ["provisioned", "overdue"]);

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const faixas: AgingFaixa[] = [
        { faixa: "A vencer 0-30d", valor: 0, count: 0, tipo: "a_vencer" },
        { faixa: "A vencer 31-60d", valor: 0, count: 0, tipo: "a_vencer" },
        { faixa: "A vencer 61-90d", valor: 0, count: 0, tipo: "a_vencer" },
        { faixa: "A vencer 90d+", valor: 0, count: 0, tipo: "a_vencer" },
        { faixa: "Vencida 1-30d", valor: 0, count: 0, tipo: "vencida" },
        { faixa: "Vencida 31-60d", valor: 0, count: 0, tipo: "vencida" },
        { faixa: "Vencida 60d+", valor: 0, count: 0, tipo: "vencida" },
      ];

      for (const item of data || []) {
        if ((item.revenues as any)?.deleted_at !== null) continue;
        const due = new Date(item.due_date + "T00:00:00");
        const diffMs = due.getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        const amount = Number(item.amount) || 0;

        let idx: number;
        if (diffDays >= 0) {
          if (diffDays <= 30) idx = 0;
          else if (diffDays <= 60) idx = 1;
          else if (diffDays <= 90) idx = 2;
          else idx = 3;
        } else {
          const overdue = Math.abs(diffDays);
          if (overdue <= 30) idx = 4;
          else if (overdue <= 60) idx = 5;
          else idx = 6;
        }

        faixas[idx].valor += amount;
        faixas[idx].count += 1;
      }

      return faixas;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
