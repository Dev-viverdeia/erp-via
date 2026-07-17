import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIrpjCsllApuracao, useExecuteIrpjCsllApuracao, type LalurAdjustment } from "@/hooks/useIrpjCsllApuracao";
import { formatCurrency } from "@/lib/format";
import LalurAdjustments from "./LalurAdjustments";
import { Calculator } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const quarters = [
  { value: "1", label: "Q1 (Jan–Mar)" },
  { value: "2", label: "Q2 (Abr–Jun)" },
  { value: "3", label: "Q3 (Jul–Set)" },
  { value: "4", label: "Q4 (Out–Dez)" },
];

export default function IrpjCsllTab() {
  const [quarter, setQuarter] = useState(String(Math.ceil((new Date().getMonth() + 1) / 3)));
  const [year, setYear] = useState(String(currentYear));
  const [adjustments, setAdjustments] = useState<LalurAdjustment[]>([]);

  const { data: result, isLoading } = useIrpjCsllApuracao(Number(quarter), Number(year), adjustments);
  const executeMutation = useExecuteIrpjCsllApuracao();

  const handleApurar = () => {
    if (!result) return;
    executeMutation.mutate({ quarter: Number(quarter), year: Number(year), result });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={quarter} onValueChange={setQuarter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {quarters.map((q) => (
              <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
      ) : result ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita Total</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-status-success">{formatCurrency(result.receita)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Despesas Totais</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(result.despesas)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lucro Contábil</CardTitle></CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${result.lucroContabil >= 0 ? "text-status-success" : "text-destructive"}`}>
                  {formatCurrency(result.lucroContabil)}
                </p>
              </CardContent>
            </Card>
          </div>

          <LalurAdjustments adjustments={adjustments} onChange={setAdjustments} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Base de Cálculo</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(result.baseCalculo)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">IRPJ (15% + Adicional 10%)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(result.irpjTotal)}</p>
                <p className="text-xs text-muted-foreground">
                  Normal: {formatCurrency(result.irpjNormal)} | Adicional: {formatCurrency(result.irpjAdicional)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">CSLL (9%)</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(result.csll)}</p></CardContent>
            </Card>
          </div>

          <Button onClick={handleApurar} disabled={executeMutation.isPending} className="gap-2">
            <Calculator className="h-4 w-4" />
            {executeMutation.isPending ? "Salvando..." : "Apurar IRPJ/CSLL"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
