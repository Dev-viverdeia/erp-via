import { useState } from "react";
import { useRazao } from "@/hooks/useAccountingReports";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function RazaoTab() {
  const now = new Date();
  const [accountId, setAccountId] = useState("");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const { data: accounts } = useChartOfAccounts();
  const analyticalAccounts = accounts?.filter((a) => a.is_analytical) || [];

  const y = parseInt(year);
  const m = parseInt(month);
  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0).toISOString().split("T")[0];

  const { data: rows, isLoading } = useRazao(accountId || undefined, startDate, endDate);

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
  const selectedAccount = accounts?.find((a) => a.id === accountId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Selecione uma conta..." />
          </SelectTrigger>
          <SelectContent>
            {analyticalAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.code} - {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>

      {!accountId ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Selecione uma conta para visualizar o razão
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div>
          {selectedAccount && (
            <p className="text-sm text-muted-foreground mb-2">
              Conta: <strong>{selectedAccount.code} - {selectedAccount.name}</strong> | Natureza: {selectedAccount.nature === "debit" ? "Devedora" : "Credora"}
            </p>
          )}
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead>Lançamento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right w-32">Débito</TableHead>
                  <TableHead className="text-right w-32">Crédito</TableHead>
                  <TableHead className="text-right w-32">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Sem movimentação no período
                    </TableCell>
                  </TableRow>
                )}
                {(rows || []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs">{formatDate(row.entry_date)}</TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]">{row.entry_description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.line_description || "—"}</TableCell>
                    <TableCell className="text-right text-xs">
                      {row.debit_amount > 0 ? formatCurrency(row.debit_amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {row.credit_amount > 0 ? formatCurrency(row.credit_amount) : "—"}
                    </TableCell>
                    <TableCell className={`text-right text-xs font-medium ${row.running_balance < 0 ? "text-destructive" : ""}`}>
                      {formatCurrency(row.running_balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
