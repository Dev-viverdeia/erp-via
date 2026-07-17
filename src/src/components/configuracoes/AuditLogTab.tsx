import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuditLog } from "@/hooks/useAuditLogs";

const TABLES = [
  "revenues", "revenue_installments", "expenses",
  "journal_entries", "journal_entry_lines",
  "bank_accounts", "bank_transactions",
  "employees", "employee_contracts",
];

const ACTIONS = ["INSERT", "UPDATE", "DELETE"];

const actionColor: Record<string, string> = {
  INSERT: "bg-status-success/10 text-status-success",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
};

export function AuditLogTab() {
  const [tableFilter, setTableFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading } = useAuditLogs({
    tableFilter: tableFilter || undefined,
    actionFilter: actionFilter || undefined,
  });

  const columns: Column<AuditLog>[] = [
    {
      header: "Data",
      cell: (row) => format(new Date(row.created_at), "dd/MM/yyyy HH:mm"),
    },
    { header: "Tabela", accessorKey: "table_name" },
    {
      header: "Ação",
      cell: (row) => (
        <Badge variant="outline" className={actionColor[row.action] ?? ""}>
          {row.action}
        </Badge>
      ),
    },
    {
      header: "Registro",
      cell: (row) => (row.record_id ? row.record_id.slice(0, 8) + "…" : "—"),
    },
    {
      header: "Usuário",
      cell: (row) => (row.user_id ? row.user_id.slice(0, 8) + "…" : "Sistema"),
    },
  ];

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={logs}
        onRowClick={setSelected}
        emptyMessage="Nenhum log de auditoria encontrado."
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Select value={tableFilter} onValueChange={(v) => setTableFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por tabela" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tabelas</SelectItem>
                {TABLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar por ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.action} em {selected?.table_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {selected?.old_data && (
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Dados anteriores</p>
                <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(selected.old_data, null, 2)}
                </pre>
              </div>
            )}
            {selected?.new_data && (
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Dados novos</p>
                <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(selected.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
