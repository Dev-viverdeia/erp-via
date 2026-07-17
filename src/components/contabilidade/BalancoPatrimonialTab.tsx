import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, CheckCircle, AlertTriangle } from "lucide-react";
import { useBalancoPatrimonial, type BalancoGroup } from "@/hooks/useBalancoPatrimonial";
import { formatCurrency } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" }, { value: "04", label: "Abril" },
  { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

function GroupTable({ group }: { group: BalancoGroup }) {
  return (
    <div className="mb-4">
      <h4 className="font-semibold font-heading text-sm text-muted-foreground mb-2">{group.label}</h4>
      <table className="w-full text-sm">
        <tbody>
          {group.rows.map((row) => (
            <tr key={row.code} className="border-b border-border/50">
              <td className="py-1.5 pl-2 text-muted-foreground w-16">{row.code}</td>
              <td className="py-1.5">{row.name}</td>
              <td className="py-1.5 text-right pr-2 tabular-nums">{formatCurrency(row.balance)}</td>
            </tr>
          ))}
          <tr className="font-semibold border-t border-foreground/20">
            <td colSpan={2} className="py-1.5 pl-2">Total {group.label}</td>
            <td className="py-1.5 text-right pr-2 tabular-nums">{formatCurrency(group.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function BalancoPatrimonialTab() {
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));

  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;

  const { data, isLoading } = useBalancoPatrimonial(startDate, endDate);

  const handleExport = () => {
    if (!data) return;
    const headers = ["Código", "Conta", "Saldo"];
    const rows: string[][] = [];

    const addGroup = (group: BalancoGroup) => {
      rows.push([group.code, `— ${group.label} —`, ""]);
      group.rows.forEach(r => rows.push([r.code, r.name, r.balance.toFixed(2)]));
      rows.push(["", `Total ${group.label}`, group.total.toFixed(2)]);
    };

    rows.push(["", "ATIVO", ""]);
    addGroup(data.ativoCirculante);
    addGroup(data.ativoNaoCirculante);
    rows.push(["", "TOTAL ATIVO", data.totalAtivo.toFixed(2)]);
    rows.push([]);
    rows.push(["", "PASSIVO + PL", ""]);
    addGroup(data.passivoCirculante);
    addGroup(data.patrimonioLiquido);
    rows.push(["", "TOTAL PASSIVO + PL", data.totalPassivoPL.toFixed(2)]);

    exportToCsv(`balanco-patrimonial-${year}-${month}`, headers, rows);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Balanço Patrimonial</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data && (
          <>
            <div className="mb-4">
              {data.isBalanced ? (
                <Badge variant="default" className="bg-status-success gap-1">
                  <CheckCircle className="h-3 w-3" /> Equação equilibrada
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> Equação desbalanceada (diferença: {formatCurrency(Math.abs(data.totalAtivo - data.totalPassivoPL))})
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold font-heading text-base mb-3 text-foreground">ATIVO</h3>
                <GroupTable group={data.ativoCirculante} />
                <GroupTable group={data.ativoNaoCirculante} />
                <div className="border-t-2 border-foreground pt-2 font-bold flex justify-between pr-2">
                  <span>TOTAL ATIVO</span>
                  <span className="tabular-nums">{formatCurrency(data.totalAtivo)}</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold font-heading text-base mb-3 text-foreground">PASSIVO + PATRIMÔNIO LÍQUIDO</h3>
                <GroupTable group={data.passivoCirculante} />
                <GroupTable group={data.patrimonioLiquido} />
                <div className="border-t-2 border-foreground pt-2 font-bold flex justify-between pr-2">
                  <span>TOTAL PASSIVO + PL</span>
                  <span className="tabular-nums">{formatCurrency(data.totalPassivoPL)}</span>
                </div>
              </div>
            </div>
          </>
        )}
        {!data && !isLoading && (
          <p className="text-muted-foreground text-sm text-center py-8">Selecione um período para visualizar o balanço.</p>
        )}
      </CardContent>
    </Card>
  );
}
