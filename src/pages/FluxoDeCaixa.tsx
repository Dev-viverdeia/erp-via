import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Landmark, TrendingUp, TrendingDown, Target } from "lucide-react";
import { useCashFlow } from "@/hooks/useCashFlow";
import { formatCurrency, formatDate } from "@/lib/format";

const FluxoDeCaixa = () => {
  const [days, setDays] = useState(90);
  const { data, isLoading } = useCashFlow(days);

  const chartData = (data?.projection ?? []).filter((_, i) => {
    if (days <= 30) return true;
    if (days <= 60) return i % 2 === 0;
    return i % 3 === 0;
  });

  const kpis = data
    ? [
        { label: "Saldo Atual", value: data.saldoAtual, icon: Landmark, color: "text-primary" },
        { label: "Entradas Previstas (30d)", value: data.entradasPrev30, icon: TrendingUp, color: "text-status-success" },
        { label: "Saídas Previstas (30d)", value: data.saidasPrev30, icon: TrendingDown, color: "text-status-error" },
        { label: "Saldo Projetado (30d)", value: data.saldoProjetado30, icon: Target, color: data.saldoProjetado30 >= 0 ? "text-primary" : "text-status-error" },
      ]
    : [];

  const movements = (data?.movements ?? []).slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Fluxo de Caixa</h1>
        <p className="text-sm text-muted-foreground">Projeção e movimentações futuras</p>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-subtle">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="glass-subtle">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className={`text-lg font-bold ${kpi.color}`}>
                  {formatCurrency(kpi.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold font-heading text-foreground">Projeção de Saldo</h3>
            <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <TabsList>
                <TabsTrigger value="30">30 dias</TabsTrigger>
                <TabsTrigger value="60">60 dias</TabsTrigger>
                <TabsTrigger value="90">90 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-[350px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval={days <= 30 ? 2 : 4} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold font-heading text-foreground mb-4">Movimentações Futuras</h3>
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
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDate(m.date)}</TableCell>
                    <TableCell className="font-medium">{m.description}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={m.type === "entrada" ? "success" : "error"}
                        variant="lighter"
                      >
                        {m.type === "entrada" ? "Entrada" : "Saída"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className={m.type === "entrada" ? "text-status-success" : "text-status-error"}>
                      {m.type === "entrada" ? "+" : "-"}{formatCurrency(m.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="info" variant="lighter">
                        {m.status === "provisioned" ? "Provisionado" : "Pendente"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma movimentação futura encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FluxoDeCaixa;
