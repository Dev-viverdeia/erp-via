import { useState } from "react";
import { usePartners, type Partner } from "@/hooks/usePartners";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PartnerFormPanel } from "@/components/partners/PartnerFormPanel";
import { PartnerDeleteDialog } from "@/components/partners/PartnerDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { exportToCsv } from "@/lib/csv-export";
import { Skeleton } from "@/components/ui/skeleton";

const typeLabels: Record<string, string> = { customer: "Cliente", vendor: "Fornecedor", both: "Ambos" };
const typeVariants: Record<string, "default" | "secondary" | "outline"> = {
  customer: "default", vendor: "secondary", both: "outline",
};

const Parceiros = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletePartner, setDeletePartner] = useState<Partner | null>(null);

  const { data: partners = [], isLoading } = usePartners(search, typeFilter);

  const columns: Column<Partner>[] = [
    { header: "Nome", accessorKey: "name" },
    {
      header: "Tipo",
      cell: (row) => <Badge variant={typeVariants[row.type] ?? "outline"}>{typeLabels[row.type] ?? row.type}</Badge>,
    },
    { header: "Documento", accessorKey: "document" },
    { header: "Email", accessorKey: "email" },
    { header: "Telefone", accessorKey: "phone" },
    {
      header: "Ações",
      className: "w-24",
      cell: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => { setEditingPartner(row); setFormOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletePartner(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou documento..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="customer">Clientes</SelectItem>
          <SelectItem value="vendor">Fornecedores</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Parceiros</h1>
          <p className="text-sm text-muted-foreground">Clientes e fornecedores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCsv("parceiros", ["Nome", "Tipo", "Documento", "Email", "Telefone"], partners.map((p) => [p.name, typeLabels[p.type] ?? p.type, p.document ?? "—", p.email ?? "—", p.phone ?? "—"]))}>
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Button onClick={() => { setEditingPartner(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Parceiro
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={partners} toolbar={toolbar} emptyMessage="Nenhum parceiro encontrado." />

      <PartnerFormPanel open={formOpen} onOpenChange={setFormOpen} partner={editingPartner} />
      <PartnerDeleteDialog open={!!deletePartner} onOpenChange={(o) => !o && setDeletePartner(null)} partner={deletePartner} />
    </div>
  );
};

export default Parceiros;
