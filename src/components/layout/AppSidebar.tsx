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

type NavItem = { title: string; url: string; icon: any };

const navGroups = [
  {
    label: "Geral",
    icon: LayoutGrid,
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Vendas", url: "/vendas", icon: ShoppingCart },
      { title: "Receitas", url: "/receitas", icon: TrendingUp },
      { title: "Despesas", url: "/despesas", icon: TrendingDown },
      { title: "Fluxo de Caixa", url: "/fluxo-de-caixa", icon: DollarSign },
    ],
  },
  {
    label: "Gestao",
    icon: Briefcase,
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Contas Bancarias", url: "/contas-bancarias", icon: Landmark },
      { title: "Pessoas", url: "/pessoas", icon: UserCheck },
    ],
  },
  {
    label: "Contabilidade",
    icon: Calculator,
    items: [
      { title: "Contabilidade", url: "/contabilidade", icon: BookOpen },
      { title: "Controladoria", url: "/controladoria", icon: PieChart },
      { title: "Fiscal", url: "/fiscal", icon: FileText },
      { title: "Conciliacao", url: "/conciliacao", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Sistema",
    icon: Cog,
    items: [
      { title: "Configuracoes", url: "/configuracoes", icon: Settings },
    ],
  },
];

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
  const logoSrc = resolvedTheme === "light" ? "/logo-black.svg" : "/logo-white.svg";
  const iconSrc = resolvedTheme === "light" ? "/icon-black.svg" : "/icon-white.svg";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar backdrop-blur-3xl">
      {/* Logo */}
      <div className={`flex h-16 shrink-0 items-center overflow-hidden ${collapsed ? 'justify-center' : 'px-5'}`}>
        {collapsed ? (
          <img
            src={iconSrc}
            alt="Viver de IA"
            className="h-6 w-auto shrink-0"
          />
        ) : (
          <img
            src={logoSrc}
            alt="Viver de IA"
            className="h-5 w-auto"
          />
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
