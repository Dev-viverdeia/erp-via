import { useState } from "react";
import { useChartOfAccounts, useSeedChartOfAccounts, type Account } from "@/hooks/useChartOfAccounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ChevronDown, Plus, Sparkles } from "lucide-react";
import { AccountFormDialog } from "./AccountFormDialog";

const typeColors: Record<string, string> = {
  asset: "bg-primary/10 text-primary",
  liability: "bg-destructive/10 text-destructive",
  equity: "bg-chart-4/10 text-chart-4",
  revenue: "bg-status-success/10 text-status-success",
  expense: "bg-status-warning/10 text-status-warning",
};

const typeLabels: Record<string, string> = {
  asset: "Ativo",
  liability: "Passivo",
  equity: "PL",
  revenue: "Receita",
  expense: "Despesa",
};

function buildTree(accounts: Account[]) {
  const map = new Map<string | null, Account[]>();
  for (const acc of accounts) {
    const parentId = acc.parent_id || null;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId)!.push(acc);
  }
  return map;
}

function AccountNode({
  account,
  tree,
  expanded,
  toggleExpanded,
  onAddChild,
  depth,
}: {
  account: Account;
  tree: Map<string | null, Account[]>;
  expanded: Set<string>;
  toggleExpanded: (id: string) => void;
  onAddChild: (parentId: string) => void;
  depth: number;
}) {
  const children = tree.get(account.id) || [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(account.id);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded-md cursor-pointer group"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => hasChildren && toggleExpanded(account.id)}
      >
        <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="w-4" />
          )}
        </span>
        <span className="font-mono text-xs text-muted-foreground w-12">{account.code}</span>
        <span className={`text-sm flex-1 ${account.is_analytical ? "" : "font-semibold"}`}>
          {account.name}
        </span>
        <Badge variant="outline" className={`text-[10px] ${typeColors[account.type] || ""}`}>
          {typeLabels[account.type] || account.type}
        </Badge>
        {account.is_analytical && (
          <Badge variant="secondary" className="text-[10px]">
            Analítica
          </Badge>
        )}
        {!account.is_analytical && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(account.id);
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isOpen &&
        children.map((child) => (
          <AccountNode
            key={child.id}
            account={child}
            tree={tree}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            onAddChild={onAddChild}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export function ChartOfAccountsTab() {
  const { data: accounts, isLoading } = useChartOfAccounts();
  const seedMutation = useSeedChartOfAccounts();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>();

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (accounts) setExpanded(new Set(accounts.filter((a) => !a.is_analytical).map((a) => a.id)));
  };

  const handleAddChild = (pid: string) => {
    setParentId(pid);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" style={{ marginLeft: `${(i % 3) * 24}px` }} />
        ))}
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
        <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
          <Sparkles className="h-4 w-4 mr-2" />
          {seedMutation.isPending ? "Gerando..." : "Gerar Plano de Contas Padrão"}
        </Button>
      </div>
    );
  }

  const tree = buildTree(accounts);
  const roots = tree.get(null) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expandir Tudo
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExpanded(new Set())}>
          Recolher Tudo
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => {
            setParentId(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar Conta
        </Button>
      </div>

      <div className="rounded-md border border-border p-2">
        {roots.map((root) => (
          <AccountNode
            key={root.id}
            account={root}
            tree={tree}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            onAddChild={handleAddChild}
            depth={0}
          />
        ))}
      </div>

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parentId={parentId}
        accounts={accounts}
      />
    </div>
  );
}
