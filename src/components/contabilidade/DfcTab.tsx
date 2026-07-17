import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, ChevronDown } from "lucide-react";
import { useDfc, type DfcSection } from "@/hooks/useDfc";
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

function SectionBlock({ section }: { section: DfcSection }) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-2 rounded hover:bg-muted/50 transition-colors">
        <span className="font-semibold text-sm">{section.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(section.total)}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <table className="w-full text-sm">
          <tbody>
            {section.items.map((item, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="py-1.5 pl-4">{item.label}</td>
                <td className={`py-1.5 text-right pr-2 tabular-nums ${item.value < 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(item.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DfcTab() {
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [method, setMethod] = useState<"direct" | "indirect">("direct");

  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;

  const { data, isLoading } = useDfc(startDate, endDate, method);

  const handleExport = () => {
    if (!data) return;
    const headers = ["Item", "Valor"];
    const rows: string[][] = [];

    const addSection = (section: DfcSection) => {
      rows.push([`— ${section.label} —`, ""]);
      section.items.forEach(i => rows.push([i.label, i.value.toFixed(2)]));
      rows.push([`Total ${section.label}`, section.total.toFixed(2)]);
    };

    addSection(data.operacional);
    addSection(data.investimento);
    addSection(data.financiamento);
    rows.push(["Variação Líquida", data.variacaoLiquida.toFixed(2)]);
    rows.push(["Saldo Inicial", data.saldoInicial.toFixed(2)]);
    rows.push(["Saldo Final", data.saldoFinal.toFixed(2)]);

    exportToCsv(`dfc-${method}-${year}-${month}`, headers, rows);
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
        <CardTitle className="text-lg">Demonstração do Fluxo de Caixa</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={method} onValueChange={(v) => setMethod(v as "direct" | "indirect")}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direto</SelectItem>
              <SelectItem value="indirect">Indireto</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="space-y-2">
            <SectionBlock section={data.operacional} />
            <SectionBlock section={data.investimento} />
            <SectionBlock section={data.financiamento} />

            <div className="border-t-2 border-foreground pt-3 space-y-2">
              <div className="flex justify-between font-bold text-base px-2">
                <span>Variação Líquida de Caixa</span>
                <span className={`tabular-nums ${data.variacaoLiquida < 0 ? "text-destructive" : "text-status-success"}`}>
                  {formatCurrency(data.variacaoLiquida)}
                </span>
              </div>
              <div className="flex justify-between text-sm px-2 text-muted-foreground">
                <span>Saldo Inicial</span>
                <span className="tabular-nums">{formatCurrency(data.saldoInicial)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm px-2">
                <span>Saldo Final</span>
                <span className="tabular-nums">{formatCurrency(data.saldoFinal)}</span>
              </div>
            </div>
          </div>
        )}
        {!data && !isLoading && (
          <p className="text-muted-foreground text-sm text-center py-8">Selecione um período para visualizar o fluxo de caixa.</p>
        )}
      </CardContent>
    </Card>
  );
}
