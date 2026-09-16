import {
  Home, ShoppingCart, TrendingUp, TrendingDown, DollarSign, Users, Truck,
  Landmark, BookOpen, PieChart, FileText, ArrowLeftRight, UserCheck, Settings,
  LayoutGrid, Briefcase, Calculator, Cog,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useTheme } from "next-themes";

import { NEGOCIO, type IdDoModulo } from "@/config/negocio";

type NavItem = { title: string; url: string; icon: any };

/* O menu nasce dos módulos do negócio (src/config/negocio.ts): um módulo
   desligado some daqui e das rotas; o título é o que a pessoa lê. */
const ITENS: Array<{ id: IdDoModulo; url: string; icon: any; grupo: string }> = [
  { id: "dashboard", url: "/", icon: Home, grupo: "Geral" },
  { id: "vendas", url: "/vendas", icon: ShoppingCart, grupo: "Geral" },
  { id: "receitas", url: "/receitas", icon: TrendingUp, grupo: "Geral" },
  { id: "despesas", url: "/despesas", icon: TrendingDown, grupo: "Geral" },
  { id: "fluxoDeCaixa", url: "/fluxo-de-caixa", icon: DollarSign, grupo: "Geral" },
  { id: "clientes", url: "/clientes", icon: Users, grupo: "Gestao" },
  { id: "fornecedores", url: "/fornecedores", icon: Truck, grupo: "Gestao" },
  { id: "contasBancarias", url: "/contas-bancarias", icon: Landmark, grupo: "Gestao" },
  { id: "pessoas", url: "/pessoas", icon: UserCheck, grupo: "Gestao" },
  { id: "contabilidade", url: "/contabilidade", icon: BookOpen, grupo: "Contabilidade" },
  { id: "controladoria", url: "/controladoria", icon: PieChart, grupo: "Contabilidade" },
  { id: "fiscal", url: "/fiscal", icon: FileText, grupo: "Contabilidade" },
  { id: "conciliacao", url: "/conciliacao", icon: ArrowLeftRight, grupo: "Contabilidade" },
  { id: "configuracoes", url: "/configuracoes", icon: Settings, grupo: "Sistema" },
];
const GRUPOS: Array<{ label: string; icon: any }> = [
  { label: "Geral", icon: LayoutGrid },
  { label: "Gestao", icon: Briefcase },
  { label: "Contabilidade", icon: Calculator },
  { label: "Sistema", icon: Cog },
];
const navGroups = GRUPOS.map((grupo) => ({
  ...grupo,
  items: ITENS.filter((item) => item.grupo === grupo.label && NEGOCIO.modulos[item.id].ativo).map((item) => ({
    title: NEGOCIO.modulos[item.id].titulo,
    url: item.url,
    icon: item.icon,
  })),
})).filter((grupo) => grupo.items.length > 0);

/* ---- Expanded nav group ---- */
function NavGroupExpanded({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <SidebarGroup className="px-3">
      <span className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 select-none">
        {label}
      </span>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="group relative flex items-center gap-3.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground"
                  activeClassName="!bg-sidebar-accent !text-sidebar-accent-foreground"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/* ---- Collapsed nav group (icon + HoverCard popover via Radix portal) ---- */
function NavGroupCollapsed({ items, label, icon: GroupIcon }: { items: NavItem[]; label: string; icon: any }) {
  return (
    <div className="px-2">
      <HoverCard openDelay={80} closeDelay={150}>
        <HoverCardTrigger asChild>
          <button
            className="flex w-full items-center justify-center rounded-full py-2.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors duration-150 cursor-pointer"
          >
            <GroupIcon className="h-[20px] w-[20px]" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-[200px] p-2 rounded-xl"
        >
          <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 select-none block">
            {label}
          </span>
          <div className="space-y-0.5">
            {items.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors duration-150"
                activeClassName="!bg-primary/10 !text-primary"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "light" ? NEGOCIO.logos.claro : NEGOCIO.logos.escuro;
  const iconSrc = resolvedTheme === "light" ? NEGOCIO.logos.iconeClaro : NEGOCIO.logos.iconeEscuro;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar backdrop-blur-3xl">
      {/* Logo */}
      <div className={`flex h-16 shrink-0 items-center overflow-hidden ${collapsed ? 'justify-center' : 'px-5'}`}>
        {collapsed ? (
          iconSrc ? (
            <img src={iconSrc} alt={NEGOCIO.nome} className="h-6 w-auto shrink-0" />
          ) : (
            <span className="text-base font-bold font-heading">{NEGOCIO.nome.slice(0, 1)}</span>
          )
        ) : logoSrc ? (
          <img src={logoSrc} alt={NEGOCIO.nome} className="h-5 w-auto" />
        ) : (
          <span className="truncate text-base font-bold font-heading">{NEGOCIO.nome}</span>
        )}
      </div>

      <SidebarContent className="py-4 overflow-y-auto">
        {collapsed ? (
          <div className="space-y-1">
            {navGroups.map((group) => (
              <NavGroupCollapsed
                key={group.label}
                items={group.items}
                label={group.label}
                icon={group.icon}
              />
            ))}
          </div>
        ) : (
          navGroups.map((group) => (
            <NavGroupExpanded
              key={group.label}
              items={group.items}
              label={group.label}
            />
          ))
        )}
      </SidebarContent>
    </Sidebar>
  );
}
