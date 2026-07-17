import { useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmployeeContracts, type EmployeeContract } from "@/hooks/useEmployeeContracts";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useContractUpload } from "@/hooks/useContractUpload";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  DollarSign,
  FileText as FileIcon,
  Briefcase,
  Calendar,
  Download,
  Upload,
  Mail,
  Phone,
  FileText,
  Building,
  CreditCard,
  Hash,
  AlertCircle,
  RefreshCw,
  User,
} from "lucide-react";

type PartnerData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  avatar_url: string | null;
};

type EmployeeWithPartner = {
  id: string;
  partner_id: string | null;
  contract_type: string;
  role: string | null;
  department: string | null;
  salary: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  bank_info: Record<string, string> | null;
  partners: PartnerData | null;
};

type ExpenseRow = {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  paid_date: string | null;
  expense_categories: { name: string } | null;
};

const expenseStatusMap: Record<
  string,
  { label: string; status: "info" | "success" | "warning" | "neutral" }
> = {
  pending: { label: "Pendente", status: "warning" },
  paid: { label: "Pago", status: "success" },
  overdue: { label: "Atrasado", status: "info" },
  cancelled: { label: "Cancelado", status: "neutral" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const PessoaProfile = () => {
  const { id } = useParams<{ id: string }>();
  const contractFileRef = useRef<HTMLInputElement>(null);
  const uploadContractIdRef = useRef<string | null>(null);

  // -- Data: employee with partner join --
  const {
    data: employee,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["employee-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, partners(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as EmployeeWithPartner;
    },
    enabled: !!id,
  });

  const partner = employee?.partners ?? null;

  // -- Data: contracts --
  const { data: contracts = [], isLoading: contractsLoading } =
    useEmployeeContracts(id);

  // -- Data: expenses linked to partner_id --
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["employee-expenses", employee?.partner_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(name)")
        .eq("partner_id", employee!.partner_id!)
        .is("deleted_at", null)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data as unknown as ExpenseRow[];
    },
    enabled: !!employee?.partner_id,
  });

  // -- Upload hooks --
  const { upload: avatarUpload } = useAvatarUpload();
  const { upload: contractUpload, getSignedUrl } = useContractUpload();

  const handleAvatarChange = (file: File) => {
    if (partner?.id) {
      avatarUpload.mutate({ file, partnerId: partner.id });
    }
  };

  const handleDownload = async (path: string) => {
    const url = await getSignedUrl(path);
    window.open(url, "_blank");
  };

  const handleContractFileSelect = (contractId: string) => {
    uploadContractIdRef.current = contractId;
    contractFileRef.current?.click();
  };

  const handleContractFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && uploadContractIdRef.current && id) {
      contractUpload.mutate({
        file,
        employeeId: id,
        contractId: uploadContractIdRef.current,
      });
    }
    e.target.value = "";
  };

  // -- Derived stats --
  const stats = useMemo(() => {
    const activeContract = contracts.find((c) => c.status === "active");
    const totalPaid = expenses
      .filter((ex) => ex.status === "paid")
      .reduce((sum, ex) => sum + ex.amount, 0);

    return {
      salary: employee?.salary ?? 0,
      contractValue: activeContract?.monthly_value ?? 0,
      totalPaid,
    };
  }, [employee, contracts, expenses]);

  // -- Error state --
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground text-sm">
          Erro ao carregar o perfil do funcionario.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  // -- Badges --
  const badges = employee
    ? [
        ...(employee.role
          ? [{ label: employee.role, variant: "secondary" as const }]
          : []),
        ...(employee.department
          ? [{ label: employee.department, variant: "secondary" as const }]
          : []),
        {
          label: employee.contract_type.toUpperCase(),
          variant: "outline" as const,
        },
        {
          label: employee.is_active ? "Ativo" : "Inativo",
          variant: employee.is_active
            ? ("default" as const)
            : ("secondary" as const),
        },
      ]
    : [];

  const bankInfo = (employee?.bank_info ?? null) as Record<
    string,
    string
  > | null;

  return (
    <div className="space-y-8">
      {/* ===== HERO ===== */}
      <ProfileHero
        name={partner?.name ?? "Funcionario"}
        avatarUrl={partner?.avatar_url}
        avatarFallback={partner ? getInitials(partner.name) : "??"}
        onAvatarChange={handleAvatarChange}
        isUploading={avatarUpload.isPending}
        badges={badges}
        backLink={{ label: "Voltar para Pessoas", href: "/pessoas" }}
        glowColor="primary"
        loading={isLoading}
        stats={[
          {
            icon: DollarSign,
            label: "Salario",
            value: stats.salary,
            color: "text-foreground",
            iconColor: "text-primary",
          },
          {
            icon: FileIcon,
            label: "Contrato Atual",
            value: stats.contractValue,
            color: "text-accent",
            iconColor: "text-accent",
          },
          {
            icon: Briefcase,
            label: "Total Pago",
            value: stats.totalPaid,
            color: "text-status-info",
            iconColor: "text-status-info",
          },
        ]}
      />

      {/* ===== TABS ===== */}
      <Tabs defaultValue="contratos" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full">
          <TabsTrigger
            value="contratos"
            className="rounded-full text-base cursor-pointer"
          >
            Contratos
          </TabsTrigger>
          <TabsTrigger
            value="informacoes"
            className="rounded-full text-base cursor-pointer"
          >
            Informacoes
          </TabsTrigger>
          <TabsTrigger
            value="bancarios"
            className="rounded-full text-base cursor-pointer"
          >
            Dados Bancarios
          </TabsTrigger>
          <TabsTrigger
            value="despesas"
            className="rounded-full text-base cursor-pointer"
          >
            Despesas
          </TabsTrigger>
        </TabsList>

        {/* ---- Tab: Contratos ---- */}
        <TabsContent value="contratos">
          {contractsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-[20px]" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <FileIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum contrato cadastrado para este funcionario.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onDownload={handleDownload}
                  onUpload={handleContractFileSelect}
                  isUploading={contractUpload.isPending}
                />
              ))}
            </div>
          )}
          {/* Hidden file input for contract upload */}
          <input
            ref={contractFileRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg"
            className="hidden"
            onChange={handleContractFileChange}
          />
        </TabsContent>

        {/* ---- Tab: Informacoes ---- */}
        <TabsContent value="informacoes">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-60 w-full rounded-[20px]" />
              <Skeleton className="h-60 w-full rounded-[20px]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInfoCard
                title="Dados Pessoais"
                items={[
                  {
                    icon: Mail,
                    label: "Email",
                    value: partner?.email,
                  },
                  {
                    icon: Phone,
                    label: "Telefone",
                    value: partner?.phone,
                  },
                  {
                    icon: FileText,
                    label: "CPF/CNPJ",
                    value: partner?.document,
                  },
                ]}
              />
              <ProfileInfoCard
                title="Emprego"
                items={[
                  {
                    icon: User,
                    label: "Cargo",
                    value: employee?.role,
                  },
                  {
                    icon: Building,
                    label: "Departamento",
                    value: employee?.department,
                  },
                  {
                    icon: Calendar,
                    label: "Data Inicio",
                    value: employee?.start_date
                      ? formatDate(employee.start_date)
                      : null,
                  },
                  {
                    icon: Calendar,
                    label: "Data Fim",
                    value: employee?.end_date
                      ? formatDate(employee.end_date)
                      : null,
                  },
                  {
                    icon: FileIcon,
                    label: "Tipo Contrato",
                    value: employee?.contract_type?.toUpperCase(),
                  },
                ]}
              />
            </div>
          )}
        </TabsContent>

        {/* ---- Tab: Dados Bancarios ---- */}
        <TabsContent value="bancarios">
          {isLoading ? (
            <Skeleton className="h-52 w-full max-w-md rounded-[20px]" />
          ) : (
            <div className="max-w-md">
              <ProfileInfoCard
                title="Dados Bancarios"
                items={[
                  {
                    icon: Building,
                    label: "Banco",
                    value: bankInfo?.banco,
                  },
                  {
                    icon: Hash,
                    label: "Agencia",
                    value: bankInfo?.agencia,
                  },
                  {
                    icon: CreditCard,
                    label: "Conta",
                    value: bankInfo?.conta,
                  },
                  {
                    icon: DollarSign,
                    label: "Tipo PIX",
                    value: bankInfo?.tipo_pix,
                  },
                ]}
              />
            </div>
          )}
        </TabsContent>

        {/* ---- Tab: Despesas ---- */}
        <TabsContent value="despesas">
          <section className="glass-panel overflow-hidden">
            {expensesLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-10 text-center">
                <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma despesa vinculada a este funcionario.
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                        Descricao
                      </TableHead>
                      <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                        Categoria
                      </TableHead>
                      <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                        Vencimento
                      </TableHead>
                      <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-right">
                        Valor
                      </TableHead>
                      <TableHead className="px-6 py-4 text-2xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => {
                      const s =
                        expenseStatusMap[exp.status] ??
                        expenseStatusMap.pending;
                      return (
                        <TableRow
                          key={exp.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="px-6 py-4">
                            <span className="text-md font-semibold text-foreground">
                              {exp.description}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-base text-muted-foreground">
                              {exp.expense_categories?.name ?? "--"}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-base text-muted-foreground">
                              {formatDate(exp.due_date)}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className="text-md font-bold tabular-nums text-foreground">
                              {formatCurrency(exp.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <StatusBadge
                              status={s.status}
                              variant="lighter"
                            >
                              {s.label}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {expenses.length} registro(s)
                  </span>
                </div>
              </>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ---- Contract Card ---- */
function ContractCard({
  contract,
  onDownload,
  onUpload,
  isUploading,
}: {
  contract: EmployeeContract;
  onDownload: (path: string) => void;
  onUpload: (contractId: string) => void;
  isUploading: boolean;
}) {
  return (
    <div className="glass-card p-5 rounded-[20px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full text-xs"
          >
            {contract.contract_type.toUpperCase()}
          </Badge>
          <Badge
            variant={
              contract.status === "active" ? "default" : "outline"
            }
            className="rounded-full text-xs"
          >
            {contract.status === "active" ? "Ativo" : "Encerrado"}
          </Badge>
        </div>
        <span className="text-lg font-bold text-foreground">
          {formatCurrency(contract.monthly_value)}/mes
        </span>
      </div>
      <p className="text-base text-muted-foreground mb-1">
        {formatDate(contract.start_date)} --{" "}
        {contract.end_date ? formatDate(contract.end_date) : "Atual"}
      </p>
      {contract.description && (
        <p className="text-base text-muted-foreground">
          {contract.description}
        </p>
      )}
      <div className="flex gap-2 mt-3">
        {contract.document_url ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full text-sm cursor-pointer"
            onClick={() => onDownload(contract.document_url!)}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar contrato
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full text-sm cursor-pointer"
            disabled={isUploading}
            onClick={() => onUpload(contract.id)}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {isUploading ? "Enviando..." : "Anexar contrato"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default PessoaProfile;
