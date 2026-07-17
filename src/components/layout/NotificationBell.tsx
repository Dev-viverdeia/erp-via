import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const { data } = useNotifications();
  const total = data?.total ?? 0;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground">
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="mb-2 text-sm font-semibold text-foreground">Pendências</p>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pendência no momento.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {(data?.overdueInstallmentsCount ?? 0) > 0 && (
              <Link to="/receitas" className="flex justify-between rounded-md p-2 hover:bg-muted">
                <span className="text-foreground">{data!.overdueInstallmentsCount} parcela(s) vencida(s)</span>
                <span className="font-medium text-destructive">{fmt(data!.overdueInstallmentsSum)}</span>
              </Link>
            )}
            {(data?.overdueExpensesCount ?? 0) > 0 && (
              <Link to="/despesas" className="flex justify-between rounded-md p-2 hover:bg-muted">
                <span className="text-foreground">{data!.overdueExpensesCount} despesa(s) vencida(s)</span>
                <span className="font-medium text-destructive">{fmt(data!.overdueExpensesSum)}</span>
              </Link>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
