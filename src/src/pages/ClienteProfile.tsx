import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, DollarSign, Clock, AlertTriangle,
  Mail, Phone, FileText, MapPin, StickyNote,
} from "lucide-react";

const revenueStatusMap: Record<string, { label: string; status: "info" | "success" | "neutral" }> = {
  active: { label: "Ativa", status: "info" },
  completed: { label: "Concluida", status: "success" },
  cancelled: { label: "Cancelada", status: "neutral" },
};

const paymentTypeLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartao",
  recurring: "Recorrente",
};

const installmentStatusMap: Record<string, { label: string; status: "info" | "warning" | "success" | "error" }> = {
  provisioned: { label: "Provisionado", status: "info" },
  pending: { label: "Pendente", status: "warning" },
  paid: { label: "Pago", status: "success" },
  overdue: { label: "Vencido", status: "error" },
};

const typeLabels: Record<string, string> = {
  customer: "Cliente",
  vendor: "Fornecedor",
  both: "Cliente / Fornecedor",
};

const ClienteProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { partner, revenues, revenueStats, isLoading } = usePartnerProfile(id);
  const { upload } = useAvatarUpload();

  // Compute avatar fallback (initials)
  const avatarFallback = useMemo(() => {
    if (!partner?.name) return "?";
    return partner.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }, [partner?.name]);

  // Collect all open installments across revenues
  const openInstallments = useMemo(() => {
    return revenues
      .flatMap((rev) =>
        (rev.revenue_installments ?? []).map((inst: {
          id: string;
          installment_number: number;
          due_date: string;
          amount: number;
          status: string;
        }) => ({
          ...inst,
          revenueName: partner?.name ?? "Receita",
        }))
      )
      .filter((i) => i.status === "provisioned" || i.status === "pending" || i.status === "overdue")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [revenues, partner?.name]);

  // Parse address
  const addr = partner?.address as Record<string, string> | null | undefined;

  const addressDisplay = useMemo(() => {
    if (!addr) return null;
    const parts = [addr.street, addr.city, addr.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }, [addr]);

  // Stats for ProfileHero
  const stats = useMemo(() => [
    { icon: TrendingUp, label: "Total Receita", value: revenueStats.total, color: "text-foreground", iconColor: "text-primary" },
    { icon: DollarSign, label: "Recebido", value: revenueStats.received, color: "text-accent", iconColor: "text-accent" },
    { icon: Clock, label: "Em Aberto", value: revenueStats.pending, color: "text-status-info", iconColor: "text-status-info" },
    { icon: AlertTriangle, label: "Vencido", value: revenueStats.overdue, color: "text-status-error", iconColor: "text-status-error" },
  ], [revenueStats]);

  // Badges
  const badges = useMemo(() => {
    if (!partner) return [];
    return [{ label: typeLabels[partner.type] ?? partner.type, variant: "secondary" as const }];
  }, [partner]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-8 md:p-10">
          <Skeleton className="h-6 w-40 mb-6" />
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
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (!partner) {
    return (
      <div className="glass-panel p-16 text-center">
        <p className="text-muted-foreground text-sm">Cliente nao encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== PROFILE HERO ===== */}
      <ProfileHero
        name={partner.name}
        avatarUrl={partner.avatar_url}
        avatarFallback={avatarFallback}
        onAvatarChange={(file) => upload.mutate({ file, partnerId: partner.id })}
        isUploading={upload.isPending}
        badges={badges}
        stats={stats}
        backLink={{ label: "Voltar para Clientes", href: "/clientes" }}
        glowColor="accent"
        loading={isLoading}
      />

      {/* ===== TABS ===== */}
      <Tabs defaultValue="receitas" className="space-y-6">
        <TabsList className="rounded-full">
          <TabsTrigger value="receitas" className="rounded-full text-base cursor-pointer">
            Receitas
          </TabsTrigger>
          <TabsTrigger value="parcelas" className="rounded-full text-base cursor-pointer">
            Parcelas em Aberto
          </TabsTrigger>
          <TabsTrigger value="informacoes" className="rounded-full text-base cursor-pointer">
            Informacoes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Receitas */}
        <TabsContent value="receitas">
          <section className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Descricao</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor Total</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Tipo</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-center">Parcelas</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhuma receita encontrada para este cliente
                    </TableCell>
                  </TableRow>
                ) : (
                  revenues.map((rev) => {
                    const s = revenueStatusMap[rev.status] ?? revenueStatusMap.active;
                    return (
                      <TableRow key={rev.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-4">
                          <p className="text-md font-semibold text-foreground">
                            {rev.notes || `Receita #${rev.id.slice(0, 8)}`}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-md font-bold tabular-nums text-foreground">
                            {formatCurrency(rev.total_amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-base text-muted-foreground">
                            {paymentTypeLabels[rev.payment_type] ?? rev.payment_type}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className="text-base text-muted-foreground tabular-nums">
                            {rev.installments_count}x
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={s.status} variant="lighter">{s.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-base text-muted-foreground">
                            {formatDate(rev.contracted_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {revenues.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{revenues.length} registro(s)</span>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Tab: Parcelas em Aberto */}
        <TabsContent value="parcelas">
          <section className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Parcela</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Vencimento</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">Valor</TableHead>
                  <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openInstallments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-16 text-sm">
                      Nenhuma parcela em aberto
                    </TableCell>
                  </TableRow>
                ) : (
                  openInstallments.map((inst) => {
                    const st = installmentStatusMap[inst.status] ?? installmentStatusMap.pending;
                    const isOverdue = inst.status === "overdue";
                    return (
                      <TableRow
                        key={inst.id}
                        className={`border-b border-border transition-colors ${
                          isOverdue ? "bg-status-error-lighter/30 hover:bg-status-error-lighter/50" : "hover:bg-muted/30"
                        }`}
                      >
                        <TableCell className="px-6 py-4">
                          <span className="text-md font-semibold text-foreground">
                            Parcela {inst.installment_number}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={`text-base ${isOverdue ? "text-status-error font-medium" : "text-muted-foreground"}`}>
                            {formatDate(inst.due_date)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <span className="text-md font-bold tabular-nums text-foreground">
                            {formatCurrency(inst.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={st.status} variant="lighter">{st.label}</StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {openInstallments.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{openInstallments.length} parcela(s) em aberto</span>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Tab: Informacoes */}
        <TabsContent value="informacoes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileInfoCard
              title="Contato"
              items={[
                { icon: Mail, label: "Email", value: partner.email },
                { icon: Phone, label: "Telefone", value: partner.phone },
                { icon: FileText, label: "Documento", value: partner.document },
              ]}
            />
            <ProfileInfoCard
              title="Detalhes"
              items={[
                { icon: MapPin, label: "Endereco", value: addressDisplay },
                { icon: StickyNote, label: "Notas", value: partner.notes },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClienteProfile;
