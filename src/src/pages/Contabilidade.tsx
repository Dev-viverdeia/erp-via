import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, FileText, BarChart3, BookMarked, Scale, ArrowUpDown, Calendar,
  ChevronRight, TrendingUp, Hash, Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useFiscalPeriods } from "@/hooks/useFiscalPeriods";
import { formatCurrency } from "@/lib/format";

const modules = [
  {
    title: "Plano de Contas",
    icon: BookOpen,
    route: "/contabilidade/plano-de-contas",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Lancamentos",
    icon: FileText,
    route: "/contabilidade/lancamentos",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Balancete",
    icon: BarChart3,
    route: "/contabilidade/balancete",
    color: "text-status-info",
    bgColor: "bg-status-info/10",
  },
  {
    title: "Razao",
    icon: BookMarked,
    route: "/contabilidade/razao",
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
  },
  {
    title: "Balanco Patrimonial",
    icon: Scale,
    route: "/contabilidade/balanco",
    color: "text-status-success",
    bgColor: "bg-status-success/10",
  },
  {
    title: "DFC",
    icon: ArrowUpDown,
    route: "/contabilidade/dfc",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    title: "Periodos Fiscais",
    icon: Calendar,
    route: "/contabilidade/periodos",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
];

const Contabilidade = () => {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading: loadingAccounts } = useChartOfAccounts();
  const { data: entries = [], isLoading: loadingEntries } = useJournalEntries();
  const { data: periods = [], isLoading: loadingPeriods } = useFiscalPeriods();

  const isLoading = loadingAccounts || loadingEntries || loadingPeriods;

  const stats = useMemo(() => {
    const activeAccounts = accounts.filter((a) => a.is_active).length;
    const now = new Date();
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.entry_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalEntries = thisMonth.length;
    const openPeriods = periods.filter((p) => p.status === "open").length;
    return { activeAccounts, totalEntries, openPeriods };
  }, [accounts, entries, periods]);

  const subtitles: Record<string, string> = {
    "Plano de Contas": `${stats.activeAccounts} contas ativas`,
    "Lancamentos": `${stats.totalEntries} lancamentos este mes`,
    "Balancete": "Verificar saldos das contas",
    "Razao": "Extrato detalhado por conta",
    "Balanco Patrimonial": "Demonstracao patrimonial",
    "DFC": "Fluxo de caixa do periodo",
    "Periodos Fiscais": `${stats.openPeriods} periodo(s) aberto(s)`,
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold opacity-80 block mb-3">
            Contabilidade
          </span>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-8">
            Modulos Contabeis
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem icon={Layers} label="Contas Ativas" value={stats.activeAccounts} loading={isLoading} isCount />
            <KpiItem icon={Hash} label="Lancamentos (mes)" value={stats.totalEntries} loading={isLoading} isCount />
            <KpiItem icon={TrendingUp} label="Periodos Abertos" value={stats.openPeriods} loading={isLoading} isCount />
          </div>
        </div>
      </section>

      {/* Module cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((mod) => (
          <button
            key={mod.route}
            onClick={() => navigate(mod.route)}
            className="glass-card p-6 rounded-[20px] text-left group cursor-pointer transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${mod.bgColor} flex items-center justify-center`}>
                <mod.icon className={`h-5 w-5 ${mod.color}`} />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{mod.title}</h3>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-sm text-muted-foreground">{subtitles[mod.title]}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

function KpiItem({ icon: Icon, label, value, loading, isCount }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; loading: boolean; isCount?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="min-w-0">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">{label}</span>
        {loading ? <Skeleton className="h-6 w-16" /> : (
          <span className="text-xl font-bold tracking-tight text-foreground">
            {isCount ? value : formatCurrency(value)}
          </span>
        )}
      </div>
    </div>
  );
}

export default Contabilidade;
