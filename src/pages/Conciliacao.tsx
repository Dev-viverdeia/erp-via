import { useState, useMemo, useEffect, useCallback } from "react";
import {
  GripVertical,
  Upload,
  Zap,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useBankTransactions, useAutoReconcile } from "@/hooks/useBankTransactions";
import { usePendingSystemEntries, type SystemEntry } from "@/hooks/usePendingSystemEntries";
import { useMultiReconcile } from "@/hooks/useMultiReconcile";
import { ImportCsvSection } from "@/components/conciliacao/ImportCsvSection";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BankTransaction = Tables<"bank_transactions">;

interface BankRowProps {
  tx: BankTransaction;
  isSelected: boolean;
  isStaged: boolean;
  onSelect: () => void;
}

interface SystemRowProps {
  entry: SystemEntry;
  isChecked: boolean;
  isSuggested: boolean;
  isStaged: boolean;
  onCheck: (id: string) => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  checkEnabled: boolean;
}

interface ReconcileFooterProps {
  selectedAmount: number;
  checkedTotal: number;
  itemCount: number;
  onReconcile: () => void;
  isPending: boolean;
}

interface KpiItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconColor: string;
  valueColor: string;
  loading: boolean;
  isCurrency?: boolean;
}

// ---------------------------------------------------------------------------
// Inline sub-components
// ---------------------------------------------------------------------------

function KpiItem({ icon: Icon, label, value, iconColor, valueColor, loading, isCurrency = true }: KpiItemProps) {
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
          <span className={`text-xl font-bold tracking-tight tabular-nums ${valueColor}`}>
            {isCurrency ? formatCurrency(typeof value === "number" ? value : 0) : value}
          </span>
        )}
      </div>
    </div>
  );
}

function BankRow({ tx, isSelected, isStaged, onSelect }: BankRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-150 cursor-pointer border-l-[3px]
        ${isSelected
          ? "border-l-accent bg-accent/5"
          : isStaged
            ? "border-l-status-success/60 bg-status-success/5 opacity-50"
            : "border-l-transparent hover:bg-muted/20"
        }`}
    >
      {isStaged && !isSelected && (
        <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground truncate">{tx.description ?? "Sem descricao"}</p>
        <p className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</p>
      </div>
      <span
        className={`text-[14px] font-bold tabular-nums shrink-0 ${
          tx.type === "credit" ? "text-status-success" : "text-destructive"
        }`}
      >
        {tx.type === "credit" ? "+" : "-"}
        {formatCurrency(tx.amount)}
      </span>
    </button>
  );
}

function SystemRow({
  entry,
  isChecked,
  isSuggested,
  isStaged,
  onCheck,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  checkEnabled,
}: SystemRowProps) {
  return (
    <div
      draggable={!isStaged}
      onDragStart={isStaged ? undefined : onDragStart}
      onDragOver={isStaged ? undefined : onDragOver}
      onDragEnd={isStaged ? undefined : onDragEnd}
      className={`flex items-center gap-3 px-5 py-3 transition-all duration-150 border-l-[3px]
        ${isDragging ? "opacity-40 scale-[0.98]" : ""}
        ${isStaged && !isChecked ? "opacity-40 border-l-status-success/60 bg-status-success/5" : ""}
        ${isSuggested && !isChecked && !isStaged ? "bg-accent/5 border-l-accent" : ""}
        ${isChecked ? "bg-primary/5 border-l-primary" : ""}
        ${!isSuggested && !isChecked && !isStaged ? "border-l-transparent hover:bg-muted/20" : ""}
      `}
    >
      {isStaged && !isChecked ? (
        <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
      ) : (
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
      )}
      {!isStaged ? (
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => onCheck(entry.id)}
          disabled={!checkEnabled}
          className="shrink-0 cursor-pointer"
        />
      ) : (
        <div className="w-4 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-[13px] truncate ${isStaged && !isChecked ? "text-muted-foreground" : "text-foreground"}`}>{entry.description}</p>
          <Badge variant="outline" className="rounded-full text-[10px] shrink-0">
            {entry.source === "installment" ? "Recebivel" : "Despesa"}
          </Badge>
          {isStaged && !isChecked && (
            <Badge variant="secondary" className="rounded-full text-[10px] shrink-0 bg-status-success/15 text-status-success">
              Match
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {entry.partnerName ? `${entry.partnerName} \u00B7 ` : ""}
          {formatDate(entry.date)}
        </p>
      </div>
      <span
        className={`text-[14px] font-bold tabular-nums shrink-0 ${
          isStaged && !isChecked ? "text-muted-foreground" : entry.type === "credit" ? "text-status-success" : "text-destructive"
        }`}
      >
        {formatCurrency(entry.amount)}
      </span>
    </div>
  );
}

function ReconcileFooter({
  selectedAmount,
  checkedTotal,
  itemCount,
  onReconcile,
  isPending,
}: ReconcileFooterProps) {
  const diff = Math.abs(checkedTotal - selectedAmount);
  const pct = selectedAmount > 0 ? (checkedTotal / selectedAmount) * 100 : 0;
  const isExact = diff < 0.01;
  const isMatch = diff <= selectedAmount * 0.05; // within 5%

  return (
    <div className="glass-panel p-4 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-[11px] text-muted-foreground block">Transacao</span>
            <span className="text-[15px] font-bold tabular-nums">{formatCurrency(selectedAmount)}</span>
          </div>
          <div className="text-[20px] text-muted-foreground">=</div>
          <div>
            <span className="text-[11px] text-muted-foreground block">
              Selecionado ({itemCount})
            </span>
            <span
              className={`text-[15px] font-bold tabular-nums ${
                isExact
                  ? "text-status-success"
                  : isMatch
                    ? "text-status-warning"
                    : "text-destructive"
              }`}
            >
              {formatCurrency(checkedTotal)}
            </span>
          </div>
          {!isExact && (
            <div>
              <span className="text-[11px] text-muted-foreground block">Diferenca</span>
              <span className="text-[13px] tabular-nums text-destructive">
                {formatCurrency(diff)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isExact
                  ? "bg-status-success"
                  : isMatch
                    ? "bg-status-warning"
                    : "bg-destructive"
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <Button
            onClick={onReconcile}
            disabled={!isMatch || isPending}
            className="rounded-full cursor-pointer"
          >
            {isPending ? "Conciliando..." : "Conciliar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function Conciliacao() {
  // --- State ---
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [stagedMatches, setStagedMatches] = useState<Map<string, Set<string>>>(new Map());
  const [rightOrder, setRightOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // All entry IDs that are staged (matched but not yet reconciled)
  const allStagedEntryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [, entryIds] of stagedMatches) {
      for (const id of entryIds) ids.add(id);
    }
    return ids;
  }, [stagedMatches]);

  const stagedTxIds = useMemo(() => new Set(stagedMatches.keys()), [stagedMatches]);

  // --- Data hooks ---
  const { data: accounts = [], isLoading: accountsLoading } = useBankAccounts();
  const {
    data: allTransactions = [],
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTransactions,
  } = useBankTransactions(
    selectedAccountId || undefined,
    undefined,
    undefined,
    "pending"
  );
  const {
    data: systemEntries = [],
    isLoading: entriesLoading,
    isError: entriesError,
    refetch: refetchEntries,
  } = usePendingSystemEntries();

  const autoReconcile = useAutoReconcile();
  const multiReconcile = useMultiReconcile();

  // Pending (unreconciled) transactions
  const pendingTransactions = useMemo(
    () => allTransactions.filter((t) => !t.reconciled),
    [allTransactions]
  );

  // Reconciled count (all transactions for KPI)
  const {
    data: allAccountTransactions = [],
    isLoading: allTxLoading,
  } = useBankTransactions(selectedAccountId || undefined);

  const reconciledCount = useMemo(
    () => allAccountTransactions.filter((t) => t.reconciled).length,
    [allAccountTransactions]
  );

  const pendingAmount = useMemo(
    () => pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [pendingTransactions]
  );

  // --- Initialize right-panel order when system entries load ---
  useEffect(() => {
    setRightOrder(systemEntries.map((e) => e.id));
  }, [systemEntries]);

  // Reset selection state when account changes
  useEffect(() => {
    setSelectedTxId(null);
    setCheckedIds(new Set());
  }, [selectedAccountId]);

  // --- Auto-suggest logic ---
  const suggestedIds = useMemo(() => {
    if (!selectedTxId) return new Set<string>();
    const tx = pendingTransactions.find((t) => t.id === selectedTxId);
    if (!tx) return new Set<string>();

    const suggestions = new Set<string>();
    const matchType = tx.type as "credit" | "debit";
    const matchEntries = systemEntries.filter((e) => e.type === matchType);

    // Exact single match
    const exactMatch = matchEntries.find(
      (e) => Math.abs(e.amount - tx.amount) < 0.01
    );
    if (exactMatch) suggestions.add(exactMatch.id);

    // Multi-match: group by partner, find combinations that sum to tx.amount
    const byPartner = new Map<string, SystemEntry[]>();
    for (const e of matchEntries) {
      const key = e.partnerName ?? "__none__";
      if (!byPartner.has(key)) byPartner.set(key, []);
      byPartner.get(key)!.push(e);
    }
    for (const [, group] of byPartner) {
      const sum = group.reduce((s, e) => s + e.amount, 0);
      if (Math.abs(sum - tx.amount) < tx.amount * 0.05) {
        group.forEach((e) => suggestions.add(e.id));
      }
    }

    return suggestions;
  }, [selectedTxId, pendingTransactions, systemEntries]);

  // Ordered entries for the right panel
  const orderedEntries = useMemo(() => {
    const entryMap = new Map(systemEntries.map((e) => [e.id, e]));
    const ordered: SystemEntry[] = [];

    // Suggested items first when a tx is selected
    if (selectedTxId) {
      const suggestedList: SystemEntry[] = [];
      const otherList: SystemEntry[] = [];

      for (const id of rightOrder) {
        const entry = entryMap.get(id);
        if (!entry) continue;
        if (suggestedIds.has(id)) {
          suggestedList.push(entry);
        } else {
          otherList.push(entry);
        }
      }
      ordered.push(...suggestedList, ...otherList);
    } else {
      for (const id of rightOrder) {
        const entry = entryMap.get(id);
        if (entry) ordered.push(entry);
      }
    }

    // Add any entries not in rightOrder (newly loaded)
    for (const e of systemEntries) {
      if (!ordered.find((o) => o.id === e.id)) {
        ordered.push(e);
      }
    }

    return ordered;
  }, [systemEntries, rightOrder, selectedTxId, suggestedIds]);

  // --- Handlers ---
  const handleSelectTx = useCallback(
    (txId: string) => {
      // Save current checks to staged matches before switching
      if (selectedTxId && checkedIds.size > 0) {
        setStagedMatches((prev) => {
          const next = new Map(prev);
          next.set(selectedTxId, new Set(checkedIds));
          return next;
        });
      } else if (selectedTxId && checkedIds.size === 0) {
        // Remove staged match if user unchecked everything
        setStagedMatches((prev) => {
          const next = new Map(prev);
          next.delete(selectedTxId);
          return next;
        });
      }

      if (selectedTxId === txId) {
        setSelectedTxId(null);
        setCheckedIds(new Set());
      } else {
        setSelectedTxId(txId);
        // Restore previously staged checks for this tx
        setCheckedIds(stagedMatches.get(txId) ?? new Set());
      }
    },
    [selectedTxId, checkedIds, stagedMatches]
  );

  const handleCheck = useCallback(
    (entryId: string) => {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(entryId)) {
          next.delete(entryId);
        } else {
          next.add(entryId);
        }
        return next;
      });
    },
    []
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, entryId: string) => {
      setDraggedId(entryId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) return;

      setRightOrder((prev) => {
        const fromIndex = prev.indexOf(draggedId);
        const toIndex = prev.indexOf(targetId);
        if (fromIndex === -1 || toIndex === -1) return prev;

        const next = [...prev];
        next.splice(fromIndex, 1);
        next.splice(toIndex, 0, draggedId);
        return next;
      });
    },
    [draggedId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const selectedTx = useMemo(
    () => (selectedTxId ? pendingTransactions.find((t) => t.id === selectedTxId) ?? null : null),
    [selectedTxId, pendingTransactions]
  );

  const checkedTotal = useMemo(() => {
    let total = 0;
    for (const id of checkedIds) {
      const entry = systemEntries.find((e) => e.id === id);
      if (entry) total += entry.amount;
    }
    return total;
  }, [checkedIds, systemEntries]);

  // Save current selection to staged before reconciling
  const saveCurrentToStaged = useCallback(() => {
    if (selectedTxId && checkedIds.size > 0) {
      setStagedMatches((prev) => {
        const next = new Map(prev);
        next.set(selectedTxId, new Set(checkedIds));
        return next;
      });
    }
  }, [selectedTxId, checkedIds]);

  const handleReconcileAll = useCallback(async () => {
    if (!selectedAccountId) return;

    // First save current selection
    saveCurrentToStaged();

    // Build final matches map (current staged + current selection)
    const finalMatches = new Map(stagedMatches);
    if (selectedTxId && checkedIds.size > 0) {
      finalMatches.set(selectedTxId, new Set(checkedIds));
    }

    if (finalMatches.size === 0) return;

    let successCount = 0;
    for (const [txId, entryIds] of finalMatches) {
      const tx = pendingTransactions.find((t) => t.id === txId);
      if (!tx) continue;
      const items = systemEntries.filter((e) => entryIds.has(e.id));
      if (items.length === 0) continue;

      try {
        await multiReconcile.mutateAsync({
          transactionId: tx.id,
          transactionDate: tx.date,
          bankAccountId: selectedAccountId,
          items,
        });
        successCount++;
      } catch (err) {
        toast.error(`Erro ao conciliar ${tx.description}: ${(err as Error).message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} transacao(oes) conciliada(s) com sucesso`);
    }
    setStagedMatches(new Map());
    setSelectedTxId(null);
    setCheckedIds(new Set());
  }, [selectedAccountId, stagedMatches, selectedTxId, checkedIds, pendingTransactions, systemEntries, multiReconcile, saveCurrentToStaged]);

  const handleAutoReconcile = useCallback(() => {
    if (!selectedAccountId) return;
    autoReconcile.mutate(selectedAccountId);
  }, [selectedAccountId, autoReconcile]);

  const isLoading = txLoading || entriesLoading || accountsLoading;
  const isError = txError || entriesError;

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* ===== HERO SECTION ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-accent font-semibold opacity-80 block mb-3">
                Conciliacao Bancaria
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Conciliacao
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-56 h-9 rounded-full bg-card border-border cursor-pointer">
                  <SelectValue placeholder="Conta bancaria" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.is_active)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id} className="cursor-pointer">
                        {a.bank_name}
                        {a.account_number ? ` \u2014 ${a.account_number}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                disabled={!selectedAccountId}
                className="h-9 px-4 rounded-full text-[13px] cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
              <Button
                size="sm"
                onClick={handleAutoReconcile}
                disabled={!selectedAccountId || autoReconcile.isPending}
                className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer"
              >
                <Zap className="h-4 w-4 mr-2" />
                {autoReconcile.isPending ? "Conciliando..." : "Auto-conciliar"}
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          {selectedAccountId && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <KpiItem
                icon={Clock}
                label="Pendentes"
                value={pendingTransactions.length}
                iconColor="text-status-warning"
                valueColor="text-foreground"
                loading={txLoading || allTxLoading}
                isCurrency={false}
              />
              <KpiItem
                icon={DollarSign}
                label="Valor Pendente"
                value={pendingAmount}
                iconColor="text-destructive"
                valueColor="text-destructive"
                loading={txLoading}
              />
              <KpiItem
                icon={CheckCircle2}
                label="Conciliadas"
                value={reconciledCount}
                iconColor="text-status-success"
                valueColor="text-status-success"
                loading={allTxLoading}
                isCurrency={false}
              />
            </div>
          )}
        </div>
      </section>

      {/* ===== NO ACCOUNT SELECTED ===== */}
      {!selectedAccountId && (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
          <ArrowLeftRight className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-[15px] text-muted-foreground font-medium mb-1">
            Selecione uma conta bancaria
          </p>
          <p className="text-[13px] text-muted-foreground/70">
            Escolha uma conta acima para iniciar a conciliacao
          </p>
        </div>
      )}

      {/* ===== ERROR STATE ===== */}
      {selectedAccountId && isError && (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive/60 mb-4" />
          <p className="text-[15px] text-foreground font-medium mb-1">
            Erro ao carregar dados
          </p>
          <p className="text-[13px] text-muted-foreground mb-4">
            Nao foi possivel carregar as transacoes ou itens do sistema.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchTransactions();
              refetchEntries();
            }}
            className="rounded-full cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* ===== LOADING STATE ===== */}
      {selectedAccountId && isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-panel p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
          <div className="glass-panel p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ALL RECONCILED SUCCESS STATE ===== */}
      {selectedAccountId &&
        !isLoading &&
        !isError &&
        pendingTransactions.length === 0 &&
        allAccountTransactions.length > 0 && (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-status-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-status-success" />
            </div>
            <p className="text-[15px] text-foreground font-medium mb-1">
              Todas as transacoes foram conciliadas
            </p>
            <p className="text-[13px] text-muted-foreground mb-4">
              {reconciledCount} transacao(oes) conciliada(s) com sucesso.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="rounded-full cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar novo extrato
            </Button>
          </div>
        )}

      {/* ===== EMPTY STATE: No transactions at all ===== */}
      {selectedAccountId &&
        !isLoading &&
        !isError &&
        allAccountTransactions.length === 0 && (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-[15px] text-foreground font-medium mb-1">
              Nenhuma transacao encontrada
            </p>
            <p className="text-[13px] text-muted-foreground mb-4">
              Importe um extrato CSV para comecar a conciliacao.
            </p>
            <Button
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="rounded-full cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          </div>
        )}

      {/* ===== SPLIT-SCREEN LAYOUT ===== */}
      {selectedAccountId &&
        !isLoading &&
        !isError &&
        pendingTransactions.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Bank Statement */}
              <section className="glass-panel p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Extrato Bancario
                  </h3>
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {pendingTransactions.length} pendentes
                  </Badge>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {pendingTransactions.map((tx) => (
                    <BankRow
                      key={tx.id}
                      tx={tx}
                      isSelected={selectedTxId === tx.id}
                      isStaged={stagedTxIds.has(tx.id) && selectedTxId !== tx.id}
                      onSelect={() => handleSelectTx(tx.id)}
                    />
                  ))}
                </div>
              </section>

              {/* Right: System Entries */}
              <section className="glass-panel p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Sistema (Pendentes)
                  </h3>
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {systemEntries.length} itens
                  </Badge>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {orderedEntries.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <p className="text-[13px] text-muted-foreground">
                        Nenhum item pendente no sistema
                      </p>
                    </div>
                  ) : (
                    orderedEntries.map((entry) => (
                      <SystemRow
                        key={entry.id}
                        entry={entry}
                        isChecked={checkedIds.has(entry.id)}
                        isSuggested={suggestedIds.has(entry.id)}
                        isStaged={allStagedEntryIds.has(entry.id) && !checkedIds.has(entry.id)}
                        onCheck={handleCheck}
                        isDragging={draggedId === entry.id}
                        onDragStart={(e) => handleDragStart(e, entry.id)}
                        onDragOver={(e) => handleDragOver(e, entry.id)}
                        onDragEnd={handleDragEnd}
                        checkEnabled={!!selectedTxId && !allStagedEntryIds.has(entry.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Reconcile Footer */}
            {(selectedTx && checkedIds.size > 0) || stagedMatches.size > 0 ? (
              <div className="glass-panel p-4 mt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-wrap">
                    {selectedTx && checkedIds.size > 0 && (
                      <>
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Transacao</span>
                          <span className="text-[15px] font-bold tabular-nums">{formatCurrency(selectedTx.amount)}</span>
                        </div>
                        <div className="text-[20px] text-muted-foreground">=</div>
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Selecionado ({checkedIds.size})</span>
                          <span className={`text-[15px] font-bold tabular-nums ${Math.abs(checkedTotal - selectedTx.amount) < 0.01 ? "text-status-success" : Math.abs(checkedTotal - selectedTx.amount) <= selectedTx.amount * 0.05 ? "text-status-warning" : "text-destructive"}`}>
                            {formatCurrency(checkedTotal)}
                          </span>
                        </div>
                      </>
                    )}
                    {stagedMatches.size > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-status-success" />
                        <span className="text-[13px] text-muted-foreground">
                          {stagedMatches.size} match(es) prontos
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedTx && checkedIds.size > 0 && (
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${Math.abs(checkedTotal - selectedTx.amount) < 0.01 ? "bg-status-success" : Math.abs(checkedTotal - selectedTx.amount) <= selectedTx.amount * 0.05 ? "bg-status-warning" : "bg-destructive"}`}
                          style={{ width: `${Math.min(100, selectedTx.amount > 0 ? (checkedTotal / selectedTx.amount) * 100 : 0)}%` }}
                        />
                      </div>
                    )}
                    <Button
                      onClick={handleReconcileAll}
                      disabled={multiReconcile.isPending || (stagedMatches.size === 0 && checkedIds.size === 0)}
                      className="rounded-full cursor-pointer"
                    >
                      {multiReconcile.isPending ? "Conciliando..." : `Conciliar ${stagedMatches.size + (checkedIds.size > 0 ? 1 : 0)} match(es)`}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

      {/* ===== IMPORT CSV DIALOG ===== */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Extrato CSV</DialogTitle>
          </DialogHeader>
          <ImportCsvSection
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
