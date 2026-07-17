import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Download, Scale, Wallet, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Landmark,
} from "lucide-react";
import { useBalancoPatrimonial, type BalancoGroup } from "@/hooks/useBalancoPatrimonial";
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

/* ---- Group card config ---- */
interface GroupCardConfig {
  group: BalancoGroup;
  label: string;
  accentClass: string;
}

/* ---- Page ---- */
const BalancoPage = () => {
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;

  const { data, isLoading, isError, refetch } = useBalancoPatrimonial(startDate, endDate);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  /* ---- Chart data ---- */
  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      {
        name: "Ativo",
        "Ativo Circulante": data.ativoCirculante.total,
        "Ativo Nao Circulante": data.ativoNaoCirculante.total,
      },
      {
        name: "Passivo + PL",
        "Passivo Circulante": data.passivoCirculante.total,
        "Patrimonio Liquido": data.patrimonioLiquido.total,
      },
    ];
  }, [data]);

  /* ---- Export ---- */
  const handleExport = () => {
    if (!data) return;
    const headers = ["Codigo", "Conta", "Saldo"];
    const rows: string[][] = [];

    const addGroup = (group: BalancoGroup) => {
      rows.push([group.code, `-- ${group.label} --`, ""]);
      group.rows.forEach((r) => rows.push([r.code, r.name, r.balance.toFixed(2)]));
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

  /* ---- Group cards config ---- */
  const groupCards: GroupCardConfig[] = data
    ? [
        { group: data.ativoCirculante, label: "ativoCirculante", accentClass: "bg-primary" },
        { group: data.ativoNaoCirculante, label: "ativoNaoCirculante", accentClass: "bg-primary/60" },
        { group: data.passivoCirculante, label: "passivoCirculante", accentClass: "bg-destructive" },
        { group: data.patrimonioLiquido, label: "patrimonioLiquido", accentClass: "bg-chart-4" },
      ]
    : [];

  /* ---- Difference for unbalanced badge ---- */
  const difference = data ? Math.abs(data.totalAtivo - data.totalPassivoPL) : 0;

  /* ---- Error state ---- */
  if (isError) {
    return (
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground text-sm">Erro ao carregar o balanco patrimonial.</p>
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
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-status-success/8 rounded-full blur-[120px] pointer-events-none" />
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
              <span className="text-[11px] uppercase tracking-[0.25em] text-status-success font-semibold opacity-80 block mb-3">
                Balanco Patrimonial
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Demonstracao Patrimonial
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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

          {/* KPIs + Equilibrio badge */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              <KpiItem
                icon={Scale}
                label="Total Ativo"
                value={data?.totalAtivo ?? 0}
                color="text-foreground"
                iconColor="text-primary"
                loading={isLoading}
              />
              <KpiItem
                icon={Landmark}
                label="Total Passivo + PL"
                value={data?.totalPassivoPL ?? 0}
                color="text-foreground"
                iconColor="text-destructive"
                loading={isLoading}
              />
            </div>
            {data && !isLoading && (
              <div className="shrink-0">
                {data.isBalanced ? (
                  <Badge className="bg-status-success/15 text-status-success border-status-success/20 gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Equilibrado
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Desequilibrado: {formatCurrency(difference)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== STACKED BAR CHART ===== */}
      <section className="glass-panel p-6 md:p-8">
        <h2 className="text-[15px] font-bold text-foreground mb-1">Composicao Patrimonial</h2>
        <p className="text-[12px] text-muted-foreground mb-6">
          Comparativo Ativo vs Passivo + Patrimonio Liquido
        </p>

        {isLoading ? (
          <Skeleton className="h-[200px] w-full rounded-xl" />
        ) : !data || (data.totalAtivo === 0 && data.totalPassivoPL === 0) ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            Sem dados para o periodo selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 600 }}
                width={100}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="Ativo Circulante" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Ativo Nao Circulante" stackId="a" fill="hsl(var(--primary)/0.6)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Passivo Circulante" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Patrimonio Liquido" stackId="a" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ===== DETAIL CARDS ===== */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[1.25rem]" />
          ))}
        </div>
      ) : data && (data.totalAtivo !== 0 || data.totalPassivoPL !== 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupCards.map(({ group, label, accentClass }) => {
            const isExpanded = expandedGroups.has(label);
            const Chevron = isExpanded ? ChevronUp : ChevronDown;
            return (
              <div key={label} className="glass-card p-5 rounded-[1.25rem]">
                <button
                  className="flex items-center justify-between w-full mb-3 cursor-pointer"
                  onClick={() => toggleGroup(label)}
                  aria-expanded={isExpanded}
                  aria-label={`Expandir ${group.label}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${accentClass} shrink-0`} />
                    <h3 className="text-[14px] font-bold text-foreground">{group.label}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold tabular-nums text-foreground">
                      {formatCurrency(group.total)}
                    </span>
                    <Chevron className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-0.5">
                    {group.rows.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground py-2 px-2">
                        Nenhuma conta encontrada neste grupo.
                      </p>
                    ) : (
                      group.rows.map((row) => (
                        <div
                          key={row.code}
                          className="flex justify-between py-1.5 px-2 text-[13px] rounded-md hover:bg-muted/20 transition-colors duration-150"
                        >
                          <span className="text-muted-foreground">
                            {row.code} {row.name}
                          </span>
                          <span className="tabular-nums text-foreground font-medium">
                            {formatCurrency(row.balance)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !isLoading && (
        <section className="glass-panel p-8">
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Wallet className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              Selecione um periodo para visualizar o balanco patrimonial.
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
  color,
  iconColor,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  iconColor: string;
  loading: boolean;
}) {
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
          <span className={`text-xl font-bold tracking-tight ${color}`}>
            {formatCurrency(value)}
          </span>
        )}
      </div>
    </div>
  );
}

export default BalancoPage;
