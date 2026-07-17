import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRecentRevenues } from "@/hooks/useDashboardData";
import { formatCurrency, formatDate } from "@/lib/format";

const statusConfig: Record<string, { label: string; status: "success" | "info" | "error" | "neutral" }> = {
  active: { label: "Ativa", status: "info" },
  completed: { label: "Concluída", status: "success" },
  cancelled: { label: "Cancelada", status: "neutral" },
};

const paymentTypeLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartão à Vista",
  recurring: "Recorrente 12x",
};

export function RecentRevenuesTable() {
  const { data, isLoading } = useRecentRevenues(10);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Últimas 10 Receitas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((rev: any) => {
                const sc = statusConfig[rev.status] ?? { label: rev.status, status: "neutral" as const };
                return (
                  <TableRow key={rev.id}>
                    <TableCell className="font-medium">{rev.partners?.name ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(Number(rev.total_amount))}</TableCell>
                    <TableCell>{paymentTypeLabels[rev.payment_type] ?? rev.payment_type}</TableCell>
                    <TableCell>
                      <StatusBadge status={sc.status} variant="lighter">{sc.label}</StatusBadge>
                    </TableCell>
                    <TableCell>{formatDate(rev.contracted_at)}</TableCell>
                  </TableRow>
                );
              })}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma receita encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
