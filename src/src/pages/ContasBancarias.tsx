import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBankAccounts, type BankAccount } from "@/hooks/useBankAccounts";
import { BankAccountFormPanel } from "@/components/bank-accounts/BankAccountFormPanel";
import { BankAccountDeleteDialog } from "@/components/bank-accounts/BankAccountDeleteDialog";
import { formatCurrency } from "@/lib/format";
import { Plus, Pencil, Power, Landmark, DollarSign, Hash } from "lucide-react";

const accountTypeLabels: Record<string, string> = {
  checking: "Corrente",
  savings: "Poupanca",
};

const ContasBancarias = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deactivateAccount, setDeactivateAccount] = useState<BankAccount | null>(null);

  const { data: accounts = [], isLoading, isError, refetch } = useBankAccounts();

  const kpis = useMemo(() => {
    const active = accounts.filter((a) => a.is_active);
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0);
    const activeCount = active.length;
    const averageBalance = activeCount > 0
      ? active.reduce((sum, a) => sum + Number(a.current_balance), 0) / activeCount
      : 0;
    return { totalBalance, activeCount, averageBalance };
  }, [accounts]);

  return (
    <div className="space-y-8">
      {/* ===== HERO HEADER ===== */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold opacity-80 block mb-3">
                Gestao Financeira
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Contas Bancarias</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { setEditingAccount(null); setFormOpen(true); }}
                className="h-9 px-5 rounded-full text-base font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Nova Conta
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={DollarSign}
              label="Saldo Total"
              value={kpis.totalBalance}
              color={kpis.totalBalance >= 0 ? "text-accent" : "text-destructive"}
              iconColor="text-accent"
              loading={isLoading}
            />
            <KpiItem
              icon={Hash}
              label="Contas Ativas"
              value={kpis.activeCount}
              color="text-foreground"
              iconColor="text-primary"
              loading={isLoading}
              isCount
            />
            <KpiItem
              icon={Landmark}
              label="Saldo Medio"
              value={kpis.averageBalance}
              color={kpis.averageBalance >= 0 ? "text-accent" : "text-destructive"}
              iconColor="text-primary"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== CONTENT ===== */}
      {isLoading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-[20px] space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : isError ? (
        <section className="glass-panel p-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Erro ao carregar contas bancarias.
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="rounded-full cursor-pointer"
          >
            Tentar novamente
          </Button>
        </section>
      ) : accounts.length === 0 ? (
        <section className="glass-panel p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            <Landmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma conta bancaria cadastrada</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Adicione sua primeira conta bancaria para comecar a gerenciar seus saldos.
          </p>
          <Button
            onClick={() => { setEditingAccount(null); setFormOpen(true); }}
            className="rounded-full cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Conta
          </Button>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="glass-card p-6 rounded-[20px]">
              {/* Header: bank info + status badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                    <Landmark className="h-[18px] w-[18px] text-accent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-foreground truncate">{account.bank_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {account.agency ? `Ag ${account.agency}` : ""}
                      {account.agency && account.account_number ? " | " : ""}
                      {account.account_number ? `Conta ${account.account_number}` : ""}
                      {!account.agency && !account.account_number ? "Sem dados de agencia" : ""}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={account.is_active ? "default" : "secondary"}
                  className="rounded-full text-xs shrink-0 ml-2"
                >
                  {account.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-1">
                  Saldo Atual
                </span>
                <span
                  className={`text-2xl font-bold tracking-tight ${
                    Number(account.current_balance) >= 0 ? "text-accent" : "text-destructive"
                  }`}
                >
                  {formatCurrency(Number(account.current_balance))}
                </span>
              </div>

              {/* Footer: type badge + actions */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="rounded-full text-xs">
                  {accountTypeLabels[account.account_type ?? "checking"] ?? account.account_type}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => {
                      setEditingAccount(account);
                      setFormOpen(true);
                    }}
                    aria-label={`Editar ${account.bank_name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive cursor-pointer"
                    onClick={() => setDeactivateAccount(account)}
                    aria-label={`Desativar ${account.bank_name}`}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ===== DIALOGS ===== */}
      <BankAccountFormPanel
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editingAccount}
      />
      <BankAccountDeleteDialog
        open={!!deactivateAccount}
        onOpenChange={(o) => !o && setDeactivateAccount(null)}
        account={deactivateAccount}
      />
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
  isCount = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  iconColor: string;
  loading: boolean;
  isCount?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
        <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <span className={`text-xl font-bold tracking-tight ${color}`}>
            {isCount ? value : formatCurrency(value)}
          </span>
        )}
      </div>
    </div>
  );
}

export default ContasBancarias;
