import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useChartOfAccounts, useSeedChartOfAccounts, type Account } from "@/hooks/useChartOfAccounts";
import { AccountFormDialog } from "@/components/contabilidade/AccountFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ChevronRight, ChevronDown, Plus, Sparkles,
  Search, ChevronUp, Layers, BookOpen,
} from "lucide-react";

/* ---- Constants ---- */
const typeLabels: Record<string, string> = {
  asset: "Ativo",
  liability: "Passivo",
  equity: "Patrimonio Liquido",
  revenue: "Receita",
  expense: "Despesa",
};

const typeColors: Record<string, string> = {
  asset: "bg-primary/15 text-primary",
  liability: "bg-destructive/15 text-destructive",
  equity: "bg-chart-4/15 text-chart-4",
  revenue: "bg-status-success/15 text-status-success",
  expense: "bg-status-warning/15 text-status-warning",
};

const typeHsl: Record<string, string> = {
  asset: "hsl(var(--primary))",
  liability: "hsl(var(--destructive))",
  equity: "hsl(var(--chart-4))",
  revenue: "hsl(var(--status-success))",
  expense: "hsl(var(--status-warning))",
};

/* ---- Tree helpers (reuse pattern from ChartOfAccountsTab) ---- */
function buildTree(accounts: Account[]) {
  const map = new Map<string | null, Account[]>();
  for (const acc of accounts) {
    const parentId = acc.parent_id || null;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId)!.push(acc);
  }
  return map;
}

/* ---- Treemap custom content ---- */
interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  depth?: number;
  color?: string;
  root?: { children?: Array<{ name: string }> };
  index?: number;
}

function CustomTreemapContent(props: TreemapContentProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", depth = 0, color } = props;

  if (depth === 0) return null;

  const showLabel = width > 50 && height > 28;
  const showSmallLabel = width > 30 && height > 18;

  const fillColor = depth === 1 ? (color || "hsl(var(--primary))") : (color || "hsl(var(--primary))");
  const fillOpacity = depth === 1 ? 0.35 : 0.7;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="hsl(var(--foreground))"
          fontSize={depth === 1 ? 13 : 10}
          fontWeight={depth === 1 ? 700 : 500}
          style={{ pointerEvents: "none" }}
        >
          {name.length > Math.floor(width / (depth === 1 ? 8 : 6))
            ? name.slice(0, Math.floor(width / (depth === 1 ? 8 : 6))) + "..."
            : name}
        </text>
      )}
      {!showLabel && showSmallLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="hsl(var(--foreground))"
          fontSize={8}
          fontWeight={500}
          style={{ pointerEvents: "none" }}
        >
          {name.slice(0, Math.floor(width / 5))}
        </text>
      )}
    </g>
  );
}

/* ---- Account node for tree view ---- */
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
        className="flex items-center gap-2 py-2 px-3 hover:bg-muted/30 rounded-lg cursor-pointer group transition-colors duration-200"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => hasChildren && toggleExpanded(account.id)}
      >
        <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="w-4" />
          )}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground w-14 shrink-0">{account.code}</span>
        <span className={`text-[13px] flex-1 ${account.is_analytical ? "" : "font-semibold"} text-foreground`}>
          {account.name}
        </span>
        <Badge variant="outline" className={`text-[10px] rounded-full ${typeColors[account.type] || ""}`}>
          {typeLabels[account.type] || account.type}
        </Badge>
        {account.is_analytical && (
          <Badge variant="secondary" className="text-[10px] rounded-full">
            Analitica
          </Badge>
        )}
        {!account.is_analytical && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200"
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

/* ---- KPI Item ---- */
function KpiItem({ icon: Icon, label, value, color, iconColor, loading }: {
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
          <Skeleton className="h-6 w-16" />
        ) : (
          <span className={`text-xl font-bold tracking-tight ${color}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- Treemap tooltip ---- */
interface TooltipPayloadItem {
  payload?: { name?: string };
}

function TreemapTooltipContent({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item?.name) return null;
  return (
    <div className="glass-card px-3 py-2 rounded-lg text-[12px] text-foreground font-medium">
      {item.name}
    </div>
  );
}

/* ---- Main Page ---- */
const PlanoDeContas = () => {
  const { data: accounts = [], isLoading, isError, refetch } = useChartOfAccounts();
  const seedMutation = useSeedChartOfAccounts();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [showTree, setShowTree] = useState(false);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(accounts.filter((a) => !a.is_analytical).map((a) => a.id)));
  };

  const handleAddChild = (pid: string) => {
    setParentId(pid);
    setDialogOpen(true);
  };

  /* KPI by type */
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 };
    accounts.filter((a) => a.is_active).forEach((a) => {
      if (counts[a.type] !== undefined) counts[a.type]++;
    });
    return counts;
  }, [accounts]);

  /* Treemap data */
  interface TreemapChild {
    name: string;
    size: number;
    color: string;
  }

  interface TreemapGroup {
    name: string;
    children: TreemapChild[];
    color: string;
  }

  const treemapData: TreemapGroup[] = useMemo(() => {
    const typeGroups: Record<string, TreemapChild[]> = {
      asset: [], liability: [], equity: [], revenue: [], expense: [],
    };
    accounts.filter((a) => a.is_analytical && a.is_active).forEach((a) => {
      typeGroups[a.type]?.push({ name: a.code + " " + a.name, size: 1, color: typeHsl[a.type] });
    });
    return Object.entries(typeGroups)
      .filter(([, items]) => items.length > 0)
      .map(([type, children]) => ({
        name: typeLabels[type],
        children,
        color: typeHsl[type],
      }));
  }, [accounts]);

  /* Filtered tree */
  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const tree = useMemo(() => buildTree(showTree ? filteredAccounts : accounts), [showTree, filteredAccounts, accounts]);
  const roots = tree.get(null) || [];

  /* ---- Error state ---- */
  if (isError) {
    return (
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-muted-foreground text-sm">Erro ao carregar plano de contas.</p>
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
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

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
              <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold opacity-80 block mb-3">
                Plano de Contas
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Estrutura Contabil
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {accounts.length === 0 && !isLoading && (
                <Button
                  variant="outline"
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="h-9 px-4 rounded-full text-[13px] cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {seedMutation.isPending ? "Gerando..." : "Gerar Padrao"}
                </Button>
              )}
              <Button
                onClick={() => { setParentId(undefined); setDialogOpen(true); }}
                className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Nova Conta
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {(Object.entries(typeCounts) as [string, number][]).map(([type, count]) => (
              <KpiItem
                key={type}
                icon={type === "asset" ? Layers : BookOpen}
                label={typeLabels[type]}
                value={count}
                color="text-foreground"
                iconColor={typeColors[type]?.includes("text-primary") ? "text-primary"
                  : typeColors[type]?.includes("text-destructive") ? "text-destructive"
                  : typeColors[type]?.includes("text-chart-4") ? "text-chart-4"
                  : typeColors[type]?.includes("text-status-success") ? "text-status-success"
                  : "text-status-warning"}
                loading={isLoading}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== TREEMAP CHART ===== */}
      <section className="glass-panel p-6 md:p-8">
        <h2 className="text-[15px] font-bold text-foreground mb-1">Mapa de Contas</h2>
        <p className="text-[12px] text-muted-foreground mb-6">
          Visualizacao das contas analiticas agrupadas por tipo
        </p>

        {isLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : treemapData.length === 0 ? (
          <div className="flex items-center justify-center h-[340px] text-sm text-muted-foreground">
            Nenhuma conta analitica cadastrada para visualizar.
          </div>
        ) : (
          <div className="w-full h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="hsl(var(--background))"
                content={<CustomTreemapContent />}
              >
                <Tooltip content={<TreemapTooltipContent />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        {!isLoading && treemapData.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
            {Object.entries(typeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: typeHsl[type], opacity: 0.7 }}
                />
                <span className="text-[11px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== TREE TABLE (collapsible) ===== */}
      <section className="glass-panel overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-6 md:px-8 cursor-pointer hover:bg-muted/20 transition-colors duration-200"
          onClick={() => setShowTree(!showTree)}
        >
          <div>
            <h2 className="text-[15px] font-bold text-foreground text-left">Ver Detalhes</h2>
            <p className="text-[12px] text-muted-foreground text-left">
              Arvore completa do plano de contas
            </p>
          </div>
          {showTree ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showTree && (
          <div className="px-6 md:px-8 pb-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conta..."
                  className="pl-10 h-9 rounded-full bg-card border-border text-[13px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="h-8 rounded-full text-[12px] cursor-pointer"
                >
                  Expandir Tudo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(new Set())}
                  className="h-8 rounded-full text-[12px] cursor-pointer"
                >
                  Recolher Tudo
                </Button>
              </div>
            </div>

            {/* Tree */}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : roots.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                {search ? "Nenhuma conta encontrada para a busca." : "Nenhuma conta cadastrada."}
              </div>
            ) : (
              <div className="rounded-xl border border-border p-2">
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
            )}

            {!isLoading && filteredAccounts.length > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-[12px] text-muted-foreground">
                  {filteredAccounts.length} conta(s)
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dialog */}
      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parentId={parentId}
        accounts={accounts}
      />
    </div>
  );
};

export default PlanoDeContas;
