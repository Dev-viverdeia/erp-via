import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Download, ArrowUpDown, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
} from "lucide-react";
import { useDfc, type DfcSection } from "@/hooks/useDfc";
import { formatCurrency } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";

/* ---- Constants ---- */
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
  { value: "03", label: "Marco" }, { value: "04", label: "Abril" },
  { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

/* ---- Waterfall entry type ---- */
interface WaterfallEntry {
  name: string;
  base: number;
  value: number;
  fill: string;
}

/* ---- Section config type ---- */
interface SectionConfig {
  key: string;
  section: DfcSection;
}

/* ---- Page ---- */
const DfcPage = () => {
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [method, setMethod] = useState<"direct" | "indirect">("direct");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["operacional", "investimento", "financiamento"])
  );

  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;

  const { data, isLoading, isError, refetch } = useDfc(startDate, endDate, method);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  /* ---- Waterfall chart data ---- */
  const waterfallData = useMemo((): WaterfallEntry[] => {
    if (!data) return [];
    const items: WaterfallEntry[] = [];
    let running = data.saldoInicial;

    items.push({
      name: "Saldo Inicial",
      base: 0,
      value: running,
      fill: "hsl(var(--muted-foreground))",
    });

    // Operational items
    data.operacional.items.forEach((item) => {
      const val = item.value;
      if (val >= 0) {
        items.push({
          name: item.label.substring(0, 18),
          base: running,
          value: val,
          fill: "hsl(var(--status-success))",
        });
      } else {
        items.push({
          name: item.label.substring(0, 18),
          base: running + val,
          value: Math.abs(val),
          fill: "hsl(var(--destructive))",
        });
      }
      running += val;
    });

    items.push({
      name: "Subtotal Op.",
      base: 0,
      value: running,
      fill: "hsl(var(--primary))",
    });

    // Investment items
    data.investimento.items.forEach((item) => {
      const val = item.value;
      if (val >= 0) {
        items.push({
          name: item.label.substring(0, 18),
          base: running,
          value: val,
          fill: "hsl(var(--status-success))",
        });
      } else {
        items.push({
          name: item.label.substring(0, 18),
          base: running + val,
          value: Math.abs(val),
          fill: "hsl(var(--destructive))",
        });
      }
      running += val;
    });

    // Financing items
    data.financiamento.items.forEach((item) => {
      const val = item.value;
      if (val >= 0) {
        items.push({
          name: item.label.substring(0, 18),
          base: running,
          value: val,
          fill: "hsl(var(--status-success))",
        });
      } else {
        items.push({
          name: item.label.substring(0, 18),
          base: running + val,
          value: Math.abs(val),
          fill: "hsl(var(--destructive))",
        });
      }
      running += val;
    });

    items.push({
      name: "Saldo Final",
      base: 0,
      value: data.saldoFinal,
      fill: "hsl(var(--accent))",
    });

    return items;
  }, [data]);

  /* ---- Export ---- */
  const handleExport = () => {
    if (!data) return;
    const headers = ["Item", "Valor"];
    const rows: string[][] = [];

    const addSection = (section: DfcSection) => {
      rows.push([`-- ${section.label} --`, ""]);
      section.items.forEach((i) => rows.push([i.label, i.value.toFixed(2)]));
      rows.push([`Total ${section.label}`, section.total.toFixed(2)]);
    };

    addSection(data.operacional);
    addSection(data.investimento);
    addSection(data.financiamento);
    rows.push(["Variacao Liquida", data.variacaoLiquida.toFixed(2)]);
    rows.push(["Saldo Inicial", data.saldoInicial.toFixed(2)]);
    rows.push(["Saldo Final", data.saldoFinal.toFixed(2)]);

    exportToCsv(`dfc-${method}-${year}-${month}`, headers, rows);
  };

  /* ---- Section cards ---- */
  const sectionCards: SectionConfig[] = data
    ? [
        { key: "operacional", section: data.operacional },
        { key: "investimento", section: data.investimento },
        { key: "financiamento", section: data.financiamento },
      ]
    : [];

  /* ---- Error state ---- */
  if (isError) {
    return (
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground text-sm">Erro ao carregar o fluxo de caixa.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="cursor-pointer">
              Tentar novamente
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== HERO ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-destructive/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <Link
            to="/contabilidade"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Contabilidade
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-destructive font-semibold opacity-80 block mb-3">
                Demonstracao do Fluxo de Caixa
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">DFC</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Method toggle */}
              <div className="flex items-center rounded-full bg-muted/50 border border-border p-0.5">
                <button
                  onClick={() => setMethod("direct")}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors duration-200 cursor-pointer ${
                    method === "direct"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Direto
                </button>
                <button
                  onClick={() => setMethod("indirect")}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors duration-200 cursor-pointer ${
                    method === "indirect"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Indireto
                </button>
              </div>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[130px] h-9 rounded-full bg-card border-border text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[90px] h-9 rounded-full bg-card border-border text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!data}
                className="h-9 px-4 rounded-full text-[13px] cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={ArrowUpDown}
              label="Operacional"
              value={data?.operacional.total ?? 0}
              iconColor="text-primary"
              loading={isLoading}
            />
            <KpiItem
              icon={TrendingDown}
              label="Investimento"
              value={data?.investimento.total ?? 0}
              iconColor="text-status-warning"
              loading={isLoading}
            />
            <KpiItem
              icon={TrendingUp}
              label="Financiamento"
              value={data?.financiamento.total ?? 0}
              iconColor="text-chart-4"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== WATERFALL CHART ===== */}
      <section className="glass-panel p-6 md:p-8">
        <h2 className="text-[15px] font-bold text-foreground mb-1">Fluxo de Caixa</h2>
        <p className="text-[12px] text-muted-foreground mb-6">
          Visualizacao waterfall do periodo - metodo {method === "direct" ? "direto" : "indireto"}
        </p>

        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-xl" />
        ) : !data || waterfallData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
            Sem dados para o periodo selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <Tooltip
                formatter={(v: number, name: string) => {
                  if (name === "base") return [null, null];
                  return [formatCurrency(v), "Valor"];
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="base" stackId="waterfall" fill="transparent" />
              <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ===== DETAIL SECTIONS ===== */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[1.25rem]" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {sectionCards.map(({ key, section }) => {
            const isExpanded = expandedSections.has(key);
            const Chevron = isExpanded ? ChevronUp : ChevronDown;
            return (
              <div key={key} className="glass-card p-5 rounded-[1.25rem]">
                <button
                  className="flex items-center justify-between w-full cursor-pointer"
                  onClick={() => toggleSection(key)}
                  aria-expanded={isExpanded}
                  aria-label={`Expandir ${section.label}`}
                >
                  <h3 className="text-[14px] font-bold text-foreground">{section.label}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[15px] font-bold tabular-nums ${
                        section.total >= 0 ? "text-status-success" : "text-destructive"
                      }`}
                    >
                      {formatCurrency(section.total)}
                    </span>
                    <Chevron className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-0.5">
                    {section.items.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground py-2 px-2">
                        Nenhum item nesta categoria.
                      </p>
                    ) : (
                      section.items.map((item, idx) => (
                        <div
                          key={`${item.label}-${idx}`}
                          className="flex justify-between py-1.5 px-2 text-[13px] rounded-md hover:bg-muted/20 transition-colors duration-150"
                        >
                          <span className="text-muted-foreground">{item.label}</span>
                          <span
                            className={`tabular-nums font-medium ${
                              item.value >= 0 ? "text-foreground" : "text-destructive"
                            }`}
                          >
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex justify-between items-center px-2">
              <span className="text-[14px] font-bold text-foreground">Variacao Liquida de Caixa</span>
              <span
                className={`text-[16px] font-bold tabular-nums ${
                  data.variacaoLiquida >= 0 ? "text-status-success" : "text-destructive"
                }`}
              >
                {formatCurrency(data.variacaoLiquida)}
              </span>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between px-2">
                <span className="text-[13px] text-muted-foreground">Saldo Inicial</span>
                <span className="text-[13px] tabular-nums text-muted-foreground font-medium">
                  {formatCurrency(data.saldoInicial)}
                </span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-[14px] font-semibold text-foreground">Saldo Final</span>
                <span className="text-[14px] font-semibold tabular-nums text-foreground">
                  {formatCurrency(data.saldoFinal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : !isLoading && (
        <section className="glass-panel p-8">
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Wallet className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              Selecione um periodo para visualizar o fluxo de caixa.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

/* ---- Inline KPI Item ---- */
function KpiItem({
  icon: Icon,
  label,
  value,
  iconColor,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  iconColor: string;
  loading: boolean;
}) {
  const colorClass = value >= 0 ? "text-status-success" : "text-destructive";

  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
        <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <span className={`text-xl font-bold tracking-tight ${colorClass}`}>
            {formatCurrency(value)}
          </span>
        )}
      </div>
    </div>
  );
}

export default DfcPage;
