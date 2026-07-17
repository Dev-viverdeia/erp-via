import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useFiscalPeriods,
  useCreateFiscalPeriod,
  useCloseFiscalPeriod,
  useReopenFiscalPeriod,
  type FiscalPeriod,
} from "@/hooks/useFiscalPeriods";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Plus, Calendar, Lock, Unlock,
} from "lucide-react";
import { formatDate } from "@/lib/format";

/* ---- Constants ---- */
const monthNames = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ---- KPI Item ---- */
function KpiItem({ icon: Icon, label, value, iconColor, loading }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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
          <Skeleton className="h-6 w-16" />
        ) : (
          <span className="text-xl font-bold tracking-tight text-foreground">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- Period Card ---- */
function PeriodCard({
  period,
  onToggle,
}: {
  period: FiscalPeriod;
  onToggle: (period: FiscalPeriod) => void;
}) {
  const isOpen = period.status === "open";

  return (
    <div className="glass-card p-5 rounded-[1.25rem]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-foreground">
          {monthNames[period.month - 1]}
        </span>
        <Badge
          variant={isOpen ? "default" : "secondary"}
          className="rounded-full text-[11px]"
        >
          {isOpen ? "Aberto" : "Fechado"}
        </Badge>
      </div>
      <p className="text-[13px] text-muted-foreground mb-1">{period.year}</p>
      <p className="text-[12px] text-muted-foreground mb-4">
        {formatDate(period.start_date)} — {formatDate(period.end_date)}
      </p>
      {period.closed_at && (
        <p className="text-[11px] text-muted-foreground mb-3">
          Fechado em {formatDate(period.closed_at)}
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="rounded-full text-[12px] w-full cursor-pointer"
        onClick={() => onToggle(period)}
      >
        {isOpen ? (
          <>
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            Fechar Periodo
          </>
        ) : (
          <>
            <Unlock className="h-3.5 w-3.5 mr-1.5" />
            Reabrir Periodo
          </>
        )}
      </Button>
    </div>
  );
}

/* ---- Main Page ---- */
const PeriodosFiscaisPage = () => {
  const { data: periods = [], isLoading, isError, refetch } = useFiscalPeriods();
  const createPeriod = useCreateFiscalPeriod();
  const closePeriod = useCloseFiscalPeriod();
  const reopenPeriod = useReopenFiscalPeriod();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newMonth, setNewMonth] = useState(String(new Date().getMonth() + 1));
  const [confirmAction, setConfirmAction] = useState<{ period: FiscalPeriod; action: "close" | "reopen" } | null>(null);

  /* KPIs */
  const kpis = useMemo(() => {
    const open = periods.filter((p) => p.status === "open").length;
    const closed = periods.filter((p) => p.status === "closed").length;
    return { open, closed };
  }, [periods]);

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)),
    []
  );

  /* Handlers */
  const handleCreate = () => {
    createPeriod.mutate(
      { year: parseInt(newYear), month: parseInt(newMonth) },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  const handleToggle = (period: FiscalPeriod) => {
    setConfirmAction({
      period,
      action: period.status === "open" ? "close" : "reopen",
    });
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.action === "close") {
      closePeriod.mutate(confirmAction.period.id, { onSuccess: () => setConfirmAction(null) });
    } else {
      reopenPeriod.mutate(confirmAction.period.id, { onSuccess: () => setConfirmAction(null) });
    }
  };

  /* ---- Error state ---- */
  if (isError) {
    return (
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-muted-foreground text-sm">Erro ao carregar periodos fiscais.</p>
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
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-chart-4/8 rounded-full blur-[120px] pointer-events-none" />
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
              <span className="text-[11px] uppercase tracking-[0.25em] text-chart-4 font-semibold opacity-80 block mb-3">
                Periodos Fiscais
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Periodos
              </h1>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Periodo
            </Button>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <KpiItem
              icon={Unlock}
              label="Abertos"
              value={kpis.open}
              iconColor="text-primary"
              loading={isLoading}
            />
            <KpiItem
              icon={Lock}
              label="Fechados"
              value={kpis.closed}
              iconColor="text-muted-foreground"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== CARD GRID ===== */}
      <section>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-[1.25rem]" />
            ))}
          </div>
        ) : periods.length === 0 ? (
          <div className="glass-panel p-8">
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Calendar className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhum periodo fiscal cadastrado.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="rounded-full text-[12px] cursor-pointer mt-1"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar primeiro periodo
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {periods.map((period) => (
                <PeriodCard key={period.id} period={period} onToggle={handleToggle} />
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-2">
              <span className="text-[12px] text-muted-foreground">
                {periods.length} periodo(s)
              </span>
            </div>
          </>
        )}
      </section>

      {/* ===== CREATE DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Periodo Fiscal</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="period-month" className="text-[12px] text-muted-foreground font-medium">
                Mes
              </label>
              <Select value={newMonth} onValueChange={setNewMonth}>
                <SelectTrigger id="period-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="period-year" className="text-[12px] text-muted-foreground font-medium">
                Ano
              </label>
              <Select value={newYear} onValueChange={setNewYear}>
                <SelectTrigger id="period-year">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createPeriod.isPending}
              className="cursor-pointer"
            >
              {createPeriod.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== CONFIRM DIALOG ===== */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "close"
                ? "Fechar Periodo Fiscal?"
                : "Reabrir Periodo Fiscal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "close"
                ? `Ao fechar o periodo de ${
                    confirmAction.period
                      ? monthNames[confirmAction.period.month - 1] + " " + confirmAction.period.year
                      : ""
                  }, novos lancamentos nao poderao ser inseridos.`
                : `Reabrir o periodo de ${
                    confirmAction?.period
                      ? monthNames[confirmAction.period.month - 1] + " " + confirmAction.period.year
                      : ""
                  } permitira novos lancamentos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="cursor-pointer"
              disabled={closePeriod.isPending || reopenPeriod.isPending}
            >
              {closePeriod.isPending || reopenPeriod.isPending ? "Processando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PeriodosFiscaisPage;
