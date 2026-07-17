import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFiscalPeriods } from "@/hooks/useFiscalPeriods";
import { usePisCofinsApuracao, useExecutePisCofinsApuracao } from "@/hooks/usePisCofinsApuracao";
import { useTaxEntries } from "@/hooks/useTaxEntries";
import { formatCurrency } from "@/lib/format";
import { Calculator, CheckCircle } from "lucide-react";

export default function PisCofinsTab() {
  const { data: periods, isLoading: periodsLoading } = useFiscalPeriods();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId) ?? null;
  const { data: result, isLoading: calcLoading } = usePisCofinsApuracao(selectedPeriod);
  const { data: existingEntries } = useTaxEntries(selectedPeriodId || undefined);
  const executeMutation = useExecutePisCofinsApuracao();

  const alreadyCalculated = existingEntries?.some(
    (e) => (e.tax_type === "pis" || e.tax_type === "cofins") && e.reference_type === "apuracao_mensal"
  );

  const handleApurar = () => {
    if (!selectedPeriod || !result) return;
    executeMutation.mutate({ period: selectedPeriod, result });
  };

  if (periodsLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            {periods?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {String(p.month).padStart(2, "0")}/{p.year} — {p.status === "closed" ? "Fechado" : "Aberto"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {alreadyCalculated && (
          <Badge variant="outline" className="gap-1 text-status-success border-status-success/30">
            <CheckCircle className="h-3 w-3" /> Apurado
          </Badge>
        )}
      </div>

      {selectedPeriodId && calcLoading && (
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">PIS — Saldo</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(result.pisSaldo)}</p>
                <p className="text-xs text-muted-foreground">
                  Débito {formatCurrency(result.pisDebito)} — Crédito {formatCurrency(result.pisCredito)}
                </p>
                <p className="text-xs mt-1">{result.pisSaldo >= 0 ? "A Recolher" : "Saldo Credor"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">COFINS — Saldo</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(result.cofinsSaldo)}</p>
                <p className="text-xs text-muted-foreground">
                  Débito {formatCurrency(result.cofinsDebito)} — Crédito {formatCurrency(result.cofinsCredito)}
                </p>
                <p className="text-xs mt-1">{result.cofinsSaldo >= 0 ? "A Recolher" : "Saldo Credor"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total a Recolher</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(Math.max(0, result.pisSaldo) + Math.max(0, result.cofinsSaldo))}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Débitos (Receitas do Período)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Pgto</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">PIS (1,65%)</TableHead>
                      <TableHead className="text-right">COFINS (7,6%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.revenueLines.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma receita no período</TableCell></TableRow>
                    ) : (
                      result.revenueLines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>{new Date(l.paid_date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.paid_amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.paid_amount * 0.0165)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.paid_amount * 0.076)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.revenueBase)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.pisDebito)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.cofinsDebito)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Créditos (Despesas Elegíveis)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">PIS (1,65%)</TableHead>
                      <TableHead className="text-right">COFINS (7,6%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.expenseLines.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma despesa elegível</TableCell></TableRow>
                    ) : (
                      result.expenseLines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="max-w-[200px] truncate">{l.description}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.amount * 0.0165)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.amount * 0.076)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.expenseBase)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.pisCredito)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.cofinsCredito)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleApurar} disabled={executeMutation.isPending} className="gap-2">
            <Calculator className="h-4 w-4" />
            {executeMutation.isPending ? "Salvando..." : alreadyCalculated ? "Recalcular PIS/COFINS" : "Apurar PIS/COFINS"}
          </Button>
        </>
      )}

      {selectedPeriodId && !calcLoading && !result && (
        <p className="text-muted-foreground">Selecione um período fiscal para calcular a apuração.</p>
      )}
    </div>
  );
}
