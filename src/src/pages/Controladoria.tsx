import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Target, BarChart3, TrendingUp, Gauge, ChevronRight, Layers, CheckCircle2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgetScenarios } from "@/hooks/useBudgetScenarios";
import { useFinancialIndicators } from "@/hooks/useFinancialIndicators";
import { formatCurrency } from "@/lib/format";

const modules = [
  { title: "Orcamento", icon: Target, route: "/controladoria/orcamento", color: "text-primary", bgColor: "bg-primary/10" },
  { title: "Orcado vs Realizado", icon: BarChart3, route: "/controladoria/orcado-vs-realizado", color: "text-accent", bgColor: "bg-accent/10" },
  { title: "Forecast", icon: TrendingUp, route: "/controladoria/forecast", color: "text-status-success", bgColor: "bg-status-success/10" },
  { title: "Indicadores", icon: Gauge, route: "/controladoria/indicadores", color: "text-status-warning", bgColor: "bg-status-warning/10" },
];

const Controladoria = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const { data: scenarios = [], isLoading: loadingScenarios } = useBudgetScenarios(currentYear);
  const { data: indicators, isLoading: loadingIndicators } = useFinancialIndicators(currentYear);

  const isLoading = loadingScenarios || loadingIndicators;

  const stats = useMemo(() => {
    const approved = scenarios.find((s) => s.status === "approved");
    return {
      scenarioName: approved?.name ?? "Nenhum aprovado",
      resultado: indicators?.resultado ?? 0,
      margem: indicators?.margemOperacional ?? 0,
    };
  }, [scenarios, indicators]);

  const subtitles: Record<string, string> = {
    "Orcamento": `${scenarios.length} cenario(s) em ${currentYear}`,
    "Orcado vs Realizado": "Analise de variacao",
    "Forecast": "Projecao financeira",
    "Indicadores": `Margem: ${stats.margem.toFixed(1)}%`,
  };

  return (
    <div className="space-y-8">
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold opacity-80 block mb-3">Controladoria</span>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-8">Gestao Orcamentaria</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem icon={Layers} label="Cenario Ativo" textValue={stats.scenarioName} loading={isLoading} />
            <KpiItem icon={DollarSign} label="Resultado (ano)" value={stats.resultado} loading={isLoading} />
            <KpiItem icon={CheckCircle2} label="Margem Operacional" textValue={`${stats.margem.toFixed(1)}%`} loading={isLoading} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod) => (
          <button key={mod.route} onClick={() => navigate(mod.route)} className="glass-card p-6 rounded-[20px] text-left group cursor-pointer transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${mod.bgColor} flex items-center justify-center`}>
                <mod.icon className={`h-5 w-5 ${mod.color}`} />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{mod.title}</h3>
            {isLoading ? <Skeleton className="h-4 w-32" /> : <p className="text-sm text-muted-foreground">{subtitles[mod.title]}</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

function KpiItem({ icon: Icon, label, value, textValue, loading }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value?: number; textValue?: string; loading: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="min-w-0">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">{label}</span>
        {loading ? <Skeleton className="h-6 w-24" /> : (
          <span className={`text-lg font-bold tracking-tight ${value !== undefined && value < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {textValue ?? (value !== undefined ? formatCurrency(value) : "—")}
          </span>
        )}
      </div>
    </div>
  );
}

export default Controladoria;
