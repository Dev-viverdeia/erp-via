import { useState } from "react";
import { useJournalEntries, type JournalEntry } from "@/hooks/useJournalEntries";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { JournalEntryFormPanel } from "./JournalEntryFormPanel";
import { JournalEntryDetailPanel } from "./JournalEntryDetailPanel";

export function JournalEntriesTab() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const { data: entries, isLoading } = useJournalEntries(undefined, undefined, search || undefined);

  const columns: Column<JournalEntry>[] = [
    {
      header: "Data",
      cell: (row) => formatDate(row.entry_date),
      className: "w-28",
    },
    {
      header: "Descrição",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[300px]">{row.description}</span>
          {row.is_reversed && (
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive">
              Estornado
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Débito",
      cell: (row) =>
        formatCurrency(
          row.journal_entry_lines.reduce((s, l) => s + Number(l.debit_amount), 0)
        ),
      className: "text-right w-36",
    },
    {
      header: "Crédito",
      cell: (row) =>
        formatCurrency(
          row.journal_entry_lines.reduce((s, l) => s + Number(l.credit_amount), 0)
        ),
      className: "text-right w-36",
    },
    {
      header: "Tipo",
      cell: (row) => (
        <Badge variant={row.is_automatic ? "secondary" : "outline"} className="text-[10px]">
          {row.is_automatic ? "Auto" : "Manual"}
        </Badge>
      ),
      className: "w-20",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={entries || []}
        onRowClick={setSelectedEntry}
        emptyMessage="Nenhum lançamento contábil encontrado"
        toolbar={
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo Lançamento
            </Button>
          </div>
        }
      />

      <JournalEntryFormPanel open={formOpen} onOpenChange={setFormOpen} />
      <JournalEntryDetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}
