import { useParams } from "react-router-dom";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingDown, DollarSign, AlertTriangle, CheckCircle2,
  Mail, Phone, FileText, MapPin, StickyNote,
} from "lucide-react";

const statusMap: Record<string, { label: string; status: "warning" | "success" | "error" | "neutral" }> = {
  pending: { label: "Pendente", status: "warning" },
  paid: { label: "Pago", status: "success" },
  overdue: { label: "Vencido", status: "error" },
  cancelled: { label: "Cancelado", status: "neutral" },
};

const typeLabels: Record<string, string> = {
  vendor: "Fornecedor",
  customer: "Cliente",
  both: "Cliente e Fornecedor",
};

const FornecedorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { partner, expenses, expenseStats, isLoading } = usePartnerProfile(id);
  const { upload } = useAvatarUpload();

  const avatarFallback = partner
    ? partner.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";

  const paidExpenses = expenses.filter((e) => e.status === "paid");

  const handleAvatarChange = (file: File) => {
    if (!id) return;
    upload.mutate({ file, partnerId: id });
  };

  const addressString = (() => {
    if (!partner?.address) return null;
    const addr = partner.address as Record<string, string>;
    const parts = [addr.street, addr.number, addr.complement, addr.neighborhood, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  })();

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="flex items-center gap-5 mb-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </section>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error / not found state ---- */
  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm">Fornecedor nao encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== PROFILE HERO ===== */}
      <ProfileHero
        name={partner.name}
        subtitle={typeLabels[partner.type] ?? partner.type}
        avatarUrl={partner.avatar_url}
        avatarFallback={avatarFallback}
        onAvatarChange={handleAvatarChange}
        isUploading={upload.isPending}
        badges={[
          { label: typeLabels[partner.type] ?? partner.type, variant: "secondary" },
        ]}
        stats={[
          {
            icon: TrendingDown,
            label: "Total Despesas",
            value: expenseStats.total,
            color: "text-foreground",
            iconColor: "text-muted-foreground",
          },
          {
            icon: CheckCircle2,
            label: "Total Pago",
            value: expenseStats.paid,
            color: "text-accent",
            iconColor: "text-accent",
          },
          {
            icon: DollarSign,
            label: "Pendente",
            value: expenseStats.pending,
            color: "text-status-warning",
            iconColor: "text-status-warning",
          },
          {
            icon: AlertTriangle,
            label: "Vencido",
            value: expenseStats.overdue,
            color: "text-destructive",
            iconColor: "text-destructive",
          },
        ]}
        backLink={{ label: "Voltar para Fornecedores", href: "/fornecedores" }}
        glowColor="destructive"
        loading={isLoading}
      />

      {/* ===== TABS ===== */}
      <Tabs defaultValue="despesas" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-full p-1">
          <TabsTrigger value="despesas" className="rounded-full text-[13px] cursor-pointer">
            Despesas
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-full text-[13px] cursor-pointer">
            Historico
          </TabsTrigger>
          <TabsTrigger value="informacoes" className="rounded-full text-[13px] cursor-pointer">
            Informacoes
          </TabsTrigger>
        </TabsList>

        {/* ---- Tab: Despesas ---- */}
        <TabsContent value="despesas">
          <section className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Descricao</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Categoria</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Vencimento</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhuma despesa encontrada para este fornecedor
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((exp) => {
                    const s = statusMap[exp.status] ?? statusMap.pending;
                    return (
                      <TableRow
                        key={exp.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-6 py-4">
                          <p className="text-[14px] font-semibold text-foreground">{exp.description}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[13px] text-muted-foreground">
                            {(exp.expense_categories as { name: string } | null)?.name ?? "\u2014"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[13px] text-muted-foreground">{formatDate(exp.due_date)}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-[14px] font-bold tabular-nums text-foreground">
                            {formatCurrency(exp.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={s.status} variant="lighter">{s.label}</StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {expenses.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-[12px] text-muted-foreground">{expenses.length} registro(s)</span>
              </div>
            )}
          </section>
        </TabsContent>

        {/* ---- Tab: Historico ---- */}
        <TabsContent value="historico">
          <section className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Descricao</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Categoria</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Data Pagamento</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhum pagamento registrado para este fornecedor
                    </TableCell>
                  </TableRow>
                ) : (
                  paidExpenses.map((exp) => (
                    <TableRow
                      key={exp.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="px-6 py-4">
                        <p className="text-[14px] font-semibold text-foreground">{exp.description}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-[13px] text-muted-foreground">
                          {(exp.expense_categories as { name: string } | null)?.name ?? "\u2014"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-[13px] text-muted-foreground">
                          {exp.paid_date ? formatDate(exp.paid_date) : "\u2014"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span className="text-[14px] font-bold tabular-nums text-foreground">
                          {formatCurrency(exp.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {paidExpenses.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-[12px] text-muted-foreground">{paidExpenses.length} registro(s)</span>
              </div>
            )}
          </section>
        </TabsContent>

        {/* ---- Tab: Informacoes ---- */}
        <TabsContent value="informacoes">
          <ProfileInfoCard
            title="Dados do Fornecedor"
            items={[
              { icon: Mail, label: "Email", value: partner.email },
              { icon: Phone, label: "Telefone", value: partner.phone },
              { icon: FileText, label: "Documento (CPF/CNPJ)", value: partner.document },
              { icon: MapPin, label: "Endereco", value: addressString },
              { icon: StickyNote, label: "Observacoes", value: partner.notes },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FornecedorProfile;
