import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NEGOCIO } from "@/config/negocio";

const routeNames: Record<string, string> = {
  "/": NEGOCIO.modulos.dashboard.titulo,
  "/vendas": NEGOCIO.modulos.vendas.titulo,
  "/receitas": NEGOCIO.modulos.receitas.titulo,
  "/despesas": NEGOCIO.modulos.despesas.titulo,
  "/fluxo-de-caixa": NEGOCIO.modulos.fluxoDeCaixa.titulo,
  "/clientes": NEGOCIO.modulos.clientes.titulo,
  "/fornecedores": NEGOCIO.modulos.fornecedores.titulo,
  "/parceiros": "Parceiros",
  "/contas-bancarias": NEGOCIO.modulos.contasBancarias.titulo,
  "/contabilidade": NEGOCIO.modulos.contabilidade.titulo,
  "/controladoria": NEGOCIO.modulos.controladoria.titulo,
  "/fiscal": NEGOCIO.modulos.fiscal.titulo,
  "/conciliacao": NEGOCIO.modulos.conciliacao.titulo,
  "/pessoas": NEGOCIO.modulos.pessoas.titulo,
  "/configuracoes": NEGOCIO.modulos.configuracoes.titulo,
};

export function AppHeader() {
  const location = useLocation();
  const pageName = routeNames[location.pathname] || "Pagina";
  const { user, signOut } = useAuth();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between bg-background/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="h-4 w-px bg-border" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                {NEGOCIO.nome}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-sm">{pageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.email ?? "Usuario"}</span>
                <span className="text-xs text-muted-foreground">Administrador</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive cursor-pointer focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
