import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useJournalEntries, type JournalEntry } from "@/hooks/useJournalEntries";
import { JournalEntryFormPanel } from "@/components/contabilidade/JournalEntryFormPanel";
import { JournalEntryDetailPanel } from "@/components/contabilidade/JournalEntryDetailPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  ArrowLeft, Plus, Search, FileText, TrendingUp, TrendingDown,
} from "lucide-react";

/* ---- KPI Item ---- */
function KpiItem({ icon: Icon, label, value, color, iconColor, loading, isCurrency = false }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  iconColor: string;
  loading: boolean;
  isCurrency?: boolean;
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
            {isCurrency ? formatCurrency(value) : value}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- Timeline entry card ---- */
function TimelineCard({
  entry,
  totalDebit,
  totalCredit,
  onClick,
  isLast,
}: {
  entry: JournalEntry;
  totalDebit: number;
  totalCredit: number;
  onClick: () => void;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shrink-0 mt-1" />
        {!isLast && <div className="w-0.5 flex-1 bg-border" />}
      </div>
      {/* Card */}
      <div
        className="glass-card p-4 rounded-[1.25rem] flex-1 mb-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-muted-foreground">
            {formatDate(entry.entry_date)}
          </span>
          <div className="flex gap-1.5">
            {entry.is_automatic && (
              <Badge variant="secondary" className="rounded-full text-[10px]">
                Auto
              </Badge>
            )}
            {entry.is_reversed && (
              <Badge variant="destructive" className="rounded-full text-[10px]">
                Estornado
              </Badge>
            )}
          </div>
        </div>
        <p className="text-[14px] font-semibold text-foreground mb-1">
          {entry.description}
        </p>
        <div className="flex gap-4 text-[13px]">
          <span className="text-primary tabular-nums">D {formatCurrency(totalDebit)}</span>
          <span className="text-destructive tabular-nums">C {formatCurrency(totalCredit)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Main Page ---- */
const LancamentosPage = () => {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);

  const { data: entries = [], isLoading, isError, refetch } = useJournalEntries(
    undefined,
    undefined,
    search || undefined
  );

  /* KPIs */
  const kpis = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    entries.forEach((e) => {
      e.journal_entry_lines.forEach((l) => {
        totalDebit += Number(l.debit_amount);
        totalCredit += Number(l.credit_amount);
      });
    });
    return { count: entries.length, totalDebit, totalCredit };
  }, [entries]);

  /* Per-entry totals */
  const entryTotals = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>();
    entries.forEach((e) => {
      let debit = 0;
      let credit = 0;
      e.journal_entry_lines.forEach((l) => {
        debit += Number(l.debit_amount);
        credit += Number(l.credit_amount);
      });
      map.set(e.id, { debit, credit });
    });
    return map;
  }, [entries]);

  /* ---- Error state ---- */
  if (isError) {
    return (
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-muted-foreground text-sm">Erro ao carregar lancamentos.</p>
            <Button variant="outline" onClick={() => refetch()} className="rounded-full cursor-pointer">
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
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
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
              <span className="text-[11px] uppercase tracking-[0.25em] text-accent font-semibold opacity-80 block mb-3">
                Lancamentos Contabeis
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Lancamentos
              </h1>
            </div>
            <Button
              onClick={() => setFormOpen(true)}
              className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Lancamento
            </Button>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={FileText}
              label="Total Lancamentos"
              value={kpis.count}
              color="text-foreground"
              iconColor="text-primary"
              loading={isLoading}
            />
            <KpiItem
              icon={TrendingUp}
              label="Total Debitos"
              value={kpis.totalDebit}
              color="text-primary"
              iconColor="text-primary"
              loading={isLoading}
              isCurrency
            />
            <KpiItem
              icon={TrendingDown}
              label="Total Creditos"
              value={kpis.totalCredit}
              color="text-destructive"
              iconColor="text-destructive"
              loading={isLoading}
              isCurrency
            />
          </div>
        </div>
      </section>

      {/* ===== SEARCH ===== */}
      <section className="flex">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descricao..."
            className="pl-10 h-10 rounded-full bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="glass-panel p-6 md:p-8">
        <h2 className="text-[15px] font-bold text-foreground mb-1">Linha do Tempo</h2>
        <p className="text-[12px] text-muted-foreground mb-6">
          Historico de lancamentos contabeis
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="w-0.5 flex-1" />
                </div>
                <Skeleton className="h-24 flex-1 rounded-[1.25rem]" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum lancamento encontrado para a busca." : "Nenhum lancamento contabil cadastrado."}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(true)}
                className="rounded-full text-[12px] cursor-pointer mt-1"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar primeiro lancamento
              </Button>
            )}
          </div>
        ) : (
          <div>
            {entries.map((entry, idx) => {
              const totals = entryTotals.get(entry.id) || { debit: 0, credit: 0 };
              return (
                <TimelineCard
                  key={entry.id}
                  entry={entry}
                  totalDebit={totals.debit}
                  totalCredit={totals.credit}
                  onClick={() => setDetailEntry(entry)}
                  isLast={idx === entries.length - 1}
                />
              );
            })}
          </div>
        )}

        {!isLoading && entries.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-[12px] text-muted-foreground">
              {entries.length} lancamento(s)
            </span>
          </div>
        )}
      </section>

      {/* Panels */}
      <JournalEntryFormPanel open={formOpen} onOpenChange={setFormOpen} />
      <JournalEntryDetailPanel entry={detailEntry} onClose={() => setDetailEntry(null)} />
    </div>
  );
};

export default LancamentosPage;
