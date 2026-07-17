import { useState, useRef, useEffect, useMemo } from "react";
import { useCostCenters, useCreateCostCenter, useUpdateCostCenter, type CostCenter } from "@/hooks/useCostCenters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Check, X, Building2, Search, CornerDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── helpers ── */

const sortByCode = (items: CostCenter[]): CostCenter[] =>
  [...items].sort((a, b) => {
    const pa = (a.code || "").split(".").map((n) => parseInt(n, 10) || 0);
    const pb = (b.code || "").split(".").map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const va = pa[i] ?? -1;
      const vb = pb[i] ?? -1;
      if (va !== vb) return va - vb;
    }
    return 0;
  });

function getNextCode(centers: CostCenter[], baseCode: string, type: "child" | "sibling" | "root"): string {
  let prefix = "";
  let targetLevel = 1;

  if (type === "child") {
    prefix = baseCode;
    targetLevel = (baseCode || "").split(".").length + 1;
  } else if (type === "sibling") {
    const parts = baseCode.split(".");
    parts.pop();
    prefix = parts.join(".");
    targetLevel = baseCode.split(".").length;
  }

  const peers = centers.filter((item) => {
    const code = item.code || "";
    const parts = code.split(".");
    if (parts.length !== targetLevel) return false;
    if (prefix === "") return true;
    return code.startsWith(prefix + ".");
  });

  let maxVal = 0;
  peers.forEach((peer) => {
    const parts = (peer.code || "").split(".");
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last) && last > maxVal) maxVal = last;
  });

  const nextVal = (maxVal + 1).toString().padStart(2, "0");
  return prefix ? `${prefix}.${nextVal}` : nextVal;
}

function findParentByCode(centers: CostCenter[], code: string): CostCenter | undefined {
  const parts = code.split(".");
  if (parts.length <= 1) return undefined;
  const parentCode = parts.slice(0, -1).join(".");
  return centers.find((c) => c.code === parentCode);
}

/* ── draft type for new/editing rows ── */

interface DraftRow {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  isNew?: boolean;
}

/* ── component ── */

export function CostCentersTab() {
  const { data: centers, isLoading } = useCostCenters(true);
  const createMutation = useCreateCostCenter();
  const updateMutation = useUpdateCostCenter();
  const { data: companyId } = useCompanyId();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [localRows, setLocalRows] = useState<DraftRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CostCenter | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync local rows from DB data
  useEffect(() => {
    if (centers) {
      setLocalRows(
        sortByCode(centers).map((c) => ({
          id: c.id,
          code: c.code || "",
          name: c.name,
          is_active: c.is_active,
        }))
      );
    }
  }, [centers]);

  useEffect(() => {
    if (editingId && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [editingId]);

  const sorted = useMemo(() => {
    return sortByCode(
      localRows.map((lr) => {
        const original = centers?.find((c) => c.id === lr.id);
        return original
          ? { ...original, code: lr.code, name: lr.name, is_active: lr.is_active }
          : ({ id: lr.id, code: lr.code, name: lr.name, is_active: lr.is_active, company_id: "", parent_id: null, created_at: "", updated_at: "" } as CostCenter);
      })
    );
  }, [localRows, centers]);

  const filtered = useMemo(() => {
    if (!searchTerm) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(
      (c) =>
        (c.code || "").toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term)
    );
  }, [sorted, searchTerm]);

  /* ── actions ── */

  const handleAddNode = (baseCode: string, type: "child" | "sibling" | "root") => {
    if (editingId) return;
    const allCodes = localRows.map((r) => ({ ...r, code: r.code || "" } as CostCenter));
    const newCode = getNextCode(allCodes as CostCenter[], baseCode, type);
    const newId = `new-${Date.now()}`;
    const newRow: DraftRow = { id: newId, code: newCode, name: "", is_active: true, isNew: true };

    const updated = [...localRows, newRow];
    // Sort using same logic
    updated.sort((a, b) => {
      const pa = (a.code || "").split(".").map((n) => parseInt(n, 10) || 0);
      const pb = (b.code || "").split(".").map((n) => parseInt(n, 10) || 0);
      const len = Math.max(pa.length, pb.length);
      for (let i = 0; i < len; i++) {
        const va = pa[i] ?? -1;
        const vb = pb[i] ?? -1;
        if (va !== vb) return va - vb;
      }
      return 0;
    });

    setLocalRows(updated);
    setEditingId(newId);
    setDraft({ ...newRow });
  };

  const handleEdit = (item: DraftRow) => {
    if (editingId) return;
    setEditingId(item.id);
    setDraft({ ...item });
  };

  const handleCancel = () => {
    if (draft?.isNew) {
      setLocalRows((prev) => prev.filter((r) => r.id !== draft.id));
    }
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async () => {
    if (!draft || !draft.code.trim() || !draft.name.trim()) {
      toast.error("Preencha o código e o nome.");
      return;
    }

    // Find parent by code hierarchy
    const parentCenter = findParentByCode(centers || [], draft.code);

    if (draft.isNew) {
      try {
        await createMutation.mutateAsync({
          name: draft.name.trim(),
          code: draft.code.trim(),
          parent_id: parentCenter?.id || null,
        });
      } catch {
        return;
      }
    } else {
      try {
        await updateMutation.mutateAsync({
          id: draft.id,
          name: draft.name.trim(),
          code: draft.code.trim(),
          parent_id: parentCenter?.id || null,
        });
      } catch {
        return;
      }
    }
    setEditingId(null);
    setDraft(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Check for children
    const hasChildren = (centers || []).some(
      (c) => c.code && deleteTarget.code && c.code.startsWith(deleteTarget.code + ".") && c.id !== deleteTarget.id
    );
    if (hasChildren) {
      toast.error("Exclua os subníveis antes de excluir este centro.");
      setDeleteTarget(null);
      return;
    }
    const { error } = await supabase.from("cost_centers").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir centro de custo.");
    } else {
      toast.success("Centro de custo excluído.");
      qc.invalidateQueries({ queryKey: ["cost-centers"] });
    }
    setDeleteTarget(null);
  };

  const handleToggleActive = async (item: CostCenter) => {
    if (editingId) return;
    await updateMutation.mutateAsync({ id: item.id, is_active: !item.is_active });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading text-foreground">Centros de Custo</h2>
          {centers && centers.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {centers.length}
            </Badge>
          )}
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar código ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-40">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-44 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !editingId ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  {searchTerm ? "Nenhum resultado para a busca." : "Nenhum centro de custo cadastrado."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const isEditing = editingId === item.id;
                const indentLevel = (item.code || "").split(".").length - 1;
                const isRoot = indentLevel === 0;
                const localDraft = localRows.find((r) => r.id === item.id);
                const isNew = localDraft && "isNew" in localDraft && localDraft.isNew;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "group transition-colors",
                      isEditing && "bg-accent/30",
                      isNew && !isEditing && "bg-accent/10"
                    )}
                  >
                    {/* CODE */}
                    <TableCell className="py-2">
                      <div style={{ paddingLeft: `${indentLevel * 1.5}rem` }} className="flex items-center">
                        {isEditing ? (
                          <Input
                            ref={firstInputRef}
                            value={draft?.code || ""}
                            onChange={(e) => setDraft((d) => d ? { ...d, code: e.target.value } : d)}
                            onKeyDown={handleKeyDown}
                            className="h-8 font-mono text-xs w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {indentLevel > 0 && <CornerDownRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                            <span className={cn("text-sm font-mono", isRoot ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                              {item.code}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* NAME */}
                    <TableCell className="py-2">
                      <div style={{ paddingLeft: `${indentLevel * 0.5}rem` }}>
                        {isEditing ? (
                          <Input
                            value={draft?.name || ""}
                            onChange={(e) => setDraft((d) => d ? { ...d, name: e.target.value } : d)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nome do centro"
                            className="h-8 text-sm w-full"
                          />
                        ) : (
                          <span className={cn("text-sm", isRoot ? "font-semibold text-foreground" : "text-foreground/80")}>
                            {item.name}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* STATUS */}
                    <TableCell className="py-2">
                      {isEditing ? (
                        <Select
                          value={draft?.is_active ? "active" : "inactive"}
                          onValueChange={(v) => setDraft((d) => d ? { ...d, is_active: v === "active" } : d)}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      )}
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell className="py-2 text-right">
                      {isEditing ? (
                        <div className="flex justify-end items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel} title="Cancelar (Esc)" disabled={isPending}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave} title="Salvar (Enter)" disabled={isPending}>
                            <Check className="h-4 w-4 text-status-success" strokeWidth={2.5} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Structural actions */}
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => handleAddNode(item.code || "", "child")}
                            disabled={!!editingId}
                            title="Adicionar subnível"
                          >
                            <CornerDownRight className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => handleAddNode(item.code || "", "sibling")}
                            disabled={!!editingId}
                            title="Adicionar no mesmo nível"
                          >
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </Button>

                          <div className="w-px h-4 bg-border mx-1" />

                          {/* Basic actions */}
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => handleEdit(localRows.find((r) => r.id === item.id)!)}
                            disabled={!!editingId}
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setDeleteTarget(item)}
                            disabled={!!editingId}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Add root button */}
        <div className="bg-muted/30 border-t border-border p-3">
          <button
            onClick={() => handleAddNode("", "root")}
            disabled={!!editingId}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all",
              editingId
                ? "border-muted text-muted-foreground cursor-not-allowed"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
            )}
          >
            <Plus className="h-4 w-4" />
            Adicionar Novo Grupo Principal
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      {editingId && (
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-4">
          <span>
            Pressione{" "}
            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-muted-foreground font-mono text-2xs">Enter</kbd>{" "}
            para salvar
          </span>
          <span>
            Pressione{" "}
            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-muted-foreground font-mono text-2xs">Esc</kbd>{" "}
            para cancelar
          </span>
        </p>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir centro de custo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o centro de custo{" "}
              <strong>{deleteTarget?.code} — {deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
