import { useState } from "react";
import { useBalancete, type BalanceteRow } from "@/hooks/useAccountingReports";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";

const typeLabels: Record<string, string> = {
  asset: "ATIVO",
  liability: "PASSIVO",
  equity: "PATRIMÔNIO LÍQUIDO",
  revenue: "RECEITAS",
  expense: "DESPESAS",
};

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function BalanceteTab() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const y = parseInt(year);
  const m = parseInt(month);
  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0).toISOString().split("T")[0];

  const { data: rows, isLoading } = useBalancete(startDate, endDate);

  // Group by type
  const grouped = new Map<string, BalanceteRow[]>();
  for (const row of rows || []) {
    if (!grouped.has(row.type)) grouped.set(row.type, []);
    grouped.get(row.type)!.push(row);
  }

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={!rows || rows.length === 0} onClick={() => { if (rows) exportToCsv("balancete", ["Código", "Conta", "Tipo", "Débitos", "Créditos", "Saldo"], rows.map((r) => [r.code, r.name, typeLabels[r.type] || r.type, formatCurrency(r.total_debit), formatCurrency(r.total_credit), formatCurrency(r.balance)])); }}>
          <Download className="h-4 w-4 mr-2" /> Exportar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Débitos</TableHead>
                <TableHead className="text-right">Créditos</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Sem movimentação no período
                  </TableCell>
                </TableRow>
              )}
              {["asset", "liability", "equity", "revenue", "expense"].flatMap((type) => {
                const group = grouped.get(type);
                if (!group || group.length === 0) return [];
                const groupDebit = group.reduce((s, r) => s + r.total_debit, 0);
                const groupCredit = group.reduce((s, r) => s + r.total_credit, 0);
                const groupBalance = group.reduce((s, r) => s + r.balance, 0);

                return [
                  <TableRow key={`header-${type}`}>
                    <TableCell colSpan={5} className="bg-muted/50 font-semibold text-xs uppercase tracking-wider">
                      {typeLabels[type] || type}
                    </TableCell>
                  </TableRow>,
                  ...group.map((row) => (
                    <TableRow key={row.account_id}>
                      <TableCell className="font-mono text-xs">{row.code}</TableCell>
                      <TableCell className="text-sm">{row.name}</TableCell>
                      <TableCell className="text-right text-sm">
                        {row.total_debit > 0 ? formatCurrency(row.total_debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.total_credit > 0 ? formatCurrency(row.total_credit) : "—"}
                      </TableCell>
                      <TableCell className={`text-right text-sm font-medium ${row.balance < 0 ? "text-destructive" : ""}`}>
                        {formatCurrency(row.balance)}
                      </TableCell>
                    </TableRow>
                  )),
                  <TableRow key={`subtotal-${type}`} className="border-t">
                    <TableCell />
                    <TableCell className="font-semibold text-xs">Subtotal {typeLabels[type]}</TableCell>
                    <TableCell className="text-right font-semibold text-xs">{formatCurrency(groupDebit)}</TableCell>
                    <TableCell className="text-right font-semibold text-xs">{formatCurrency(groupCredit)}</TableCell>
                    <TableCell className="text-right font-semibold text-xs">{formatCurrency(groupBalance)}</TableCell>
                  </TableRow>,
                ];
              })}
            </TableBody>
            {rows && rows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell />
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(rows.reduce((s, r) => s + r.total_debit, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(rows.reduce((s, r) => s + r.total_credit, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(rows.reduce((s, r) => s + r.balance, 0))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      )}
    </div>
  );
}
