import { useMemo } from "react";
import { useBalancete } from "./useAccountingReports";

export interface DreResumo {
  receitaBruta: number;
  despesasOperacionais: number;
  resultado: number;
}

export function useDreResumo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0).toISOString().split("T")[0];

  const { data: rows, isLoading } = useBalancete(startDate, endDate);

  const dre = useMemo<DreResumo>(() => {
    if (!rows) return { receitaBruta: 0, despesasOperacionais: 0, resultado: 0 };

    const receitaBruta = rows
      .filter((r) => r.type === "revenue")
      .reduce((s, r) => s + r.balance, 0);

    const despesasOperacionais = rows
      .filter((r) => r.type === "expense")
      .reduce((s, r) => s + r.balance, 0);

    return {
      receitaBruta,
      despesasOperacionais,
      resultado: receitaBruta - despesasOperacionais,
    };
  }, [rows]);

  return { data: dre, isLoading };
}
