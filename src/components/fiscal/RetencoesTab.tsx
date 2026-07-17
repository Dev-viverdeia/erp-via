import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useWithholdingTaxes, type WithholdingTax } from "@/hooks/useWithholdingTaxes";
import { formatCurrency } from "@/lib/format";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const TAX_TYPE_LABELS: Record<string, string> = {
  ir: "IR",
  pis: "PIS",
  cofins: "COFINS",
  csll: "CSLL",
};

export default function RetencoesTab() {
  const [year, setYear] = useState(String(currentYear));
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data: withholdings, isLoading } = useWithholdingTaxes(startDate, endDate);

  // Group by partner for DIRF view
  const partnerReport = (withholdings || []).reduce<
    Record<string, { name: string; ir: number; pis: number; cofins: number; csll: number; total: number }>
  >((acc, wt) => {
    const partnerId = wt.expenses?.partner_id || "sem_parceiro";
    const partnerName = wt.expenses?.partners?.name || "Sem Parceiro";
    if (!acc[partnerId]) {
      acc[partnerId] = { name: partnerName, ir: 0, pis: 0, cofins: 0, csll: 0, total: 0 };
    }
    const amount = Number(wt.withheld_amount);
    const taxKey = wt.tax_type as "ir" | "pis" | "cofins" | "csll";
    if (taxKey in acc[partnerId]) {
      acc[partnerId][taxKey] += amount;
    }
    acc[partnerId].total += amount;
    return acc;
  }, {});

  const columns: Column<WithholdingTax>[] = [
    {
      header: "Fornecedor",
      cell: (row) => row.expenses?.partners?.name || "—",
    },
    {
      header: "Despesa",
      cell: (row) => (
        <span className="max-w-[200px] truncate block">{row.expenses?.description || "—"}</span>
      ),
    },
    {
      header: "Tipo",
      cell: (row) => (
        <Badge variant="outline">{TAX_TYPE_LABELS[row.tax_type] || row.tax_type}</Badge>
      ),
    },
    {
      header: "Base",
      cell: (row) => formatCurrency(Number(row.base_amount)),
      className: "text-right",
    },
    {
      header: "Alíquota",
      cell: (row) => `${Number(row.rate)}%`,
      className: "text-right",
    },
    {
      header: "Retido",
      cell: (row) => formatCurrency(Number(row.withheld_amount)),
      className: "text-right",
    },
    {
      header: "Data Pgto",
      cell: (row) =>
        row.expenses?.paid_date
          ? new Date(row.expenses.paid_date + "T12:00:00").toLocaleDateString("pt-BR")
          : "—",
    },
  ];

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-32" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{withholdings?.length || 0} retenção(ões)</span>
      </div>

      <DataTable columns={columns} data={withholdings || []} emptyMessage="Nenhuma retenção registrada no período." />

      {Object.keys(partnerReport).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relatório por Fornecedor (DIRF)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium text-muted-foreground">Fornecedor</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">IR</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">PIS</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">COFINS</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">CSLL</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(partnerReport).map(([id, row]) => (
                    <tr key={id} className="border-b last:border-0">
                      <td className="p-3">{row.name}</td>
                      <td className="p-3 text-right">{formatCurrency(row.ir)}</td>
                      <td className="p-3 text-right">{formatCurrency(row.pis)}</td>
                      <td className="p-3 text-right">{formatCurrency(row.cofins)}</td>
                      <td className="p-3 text-right">{formatCurrency(row.csll)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
