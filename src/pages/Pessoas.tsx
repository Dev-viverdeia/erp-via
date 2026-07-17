import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { EmployeeFormPanel } from "@/components/pessoas/EmployeeFormPanel";
import { EmployeeDeleteDialog } from "@/components/pessoas/EmployeeDeleteDialog";
import { formatCurrency } from "@/lib/format";
import { exportToCsv } from "@/lib/csv-export";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Users,
  UserCheck,
  DollarSign,
  Download,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const Pessoas = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useEmployees(
    search || undefined,
    typeFilter
  );

  // Client-side status filter
  const filteredEmployees = useMemo(() => {
    if (statusFilter === "all") return employees;
    const isActive = statusFilter === "active";
    return employees.filter((e) => e.is_active === isActive);
  }, [employees, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.is_active).length;
    const monthlyPayroll = employees
      .filter((e) => e.is_active)
      .reduce((sum, e) => sum + (e.salary ?? 0), 0);
    return { total, active, monthlyPayroll };
  }, [employees]);

  const handleExport = () => {
    exportToCsv(
      "pessoas",
      ["Nome", "Tipo", "Cargo", "Departamento", "Salario", "Status"],
      filteredEmployees.map((e) => [
        e.partners?.name ?? "--",
        e.contract_type.toUpperCase(),
        e.role ?? "--",
        e.department ?? "--",
        e.salary != null ? formatCurrency(e.salary) : "--",
        e.is_active ? "Ativo" : "Inativo",
      ])
    );
  };

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
              <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold opacity-80 block mb-3">
                Gestao de Pessoas
              </span>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Pessoas
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9 px-4 rounded-full text-[13px] cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
              <Button
                onClick={() => {
                  setEditingEmployee(null);
                  setFormOpen(true);
                }}
                className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Novo Funcionario
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiItem
              icon={Users}
              label="Total Pessoas"
              value={kpis.total}
              color="text-foreground"
              iconColor="text-primary"
              loading={isLoading}
              isCount
            />
            <KpiItem
              icon={UserCheck}
              label="Ativos"
              value={kpis.active}
              color="text-accent"
              iconColor="text-accent"
              loading={isLoading}
              isCount
            />
            <KpiItem
              icon={DollarSign}
              label="Folha Mensal"
              value={kpis.monthlyPayroll}
              color="text-status-info"
              iconColor="text-status-info"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* ===== FILTERS ===== */}
      <section className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cargo ou departamento..."
            className="pl-10 h-10 rounded-full bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-10 rounded-full bg-card border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pj">PJ</SelectItem>
            <SelectItem value="clt">CLT</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10 rounded-full bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* ===== DATA TABLE ===== */}
      <section className="glass-panel overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                    Nome
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                    Tipo
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                    Cargo
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                    Departamento
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                    Salario
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-4 w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-16 text-sm"
                    >
                      Nenhum funcionario encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/pessoas/${emp.id}`)}
                    >
                      <TableCell className="px-6 py-4">
                        <span className="text-[14px] font-semibold text-foreground">
                          {emp.partners?.name ?? "--"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="rounded-full text-[11px]"
                        >
                          {emp.contract_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-[13px] text-muted-foreground">
                          {emp.role ?? "--"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-[13px] text-muted-foreground">
                          {emp.department ?? "--"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span className="text-[14px] font-bold tabular-nums text-foreground">
                          {emp.salary != null
                            ? formatCurrency(emp.salary)
                            : "--"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <StatusBadge
                          status={emp.is_active ? "success" : "neutral"}
                          variant="lighter"
                        >
                          {emp.is_active ? "Ativo" : "Inativo"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/pessoas/${emp.id}`)
                              }
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" /> Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingEmployee(emp);
                                setFormOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteEmployee(emp)}
                              className="text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {filteredEmployees.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-[12px] text-muted-foreground">
                  {filteredEmployees.length} registro(s)
                </span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Dialogs */}
      <EmployeeFormPanel
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editingEmployee}
      />
      <EmployeeDeleteDialog
        open={!!deleteEmployee}
        onOpenChange={(o) => !o && setDeleteEmployee(null)}
        employee={deleteEmployee}
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
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
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

export default Pessoas;
