import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Vendas from "./pages/Vendas";
import VendaProfile from "./pages/VendaProfile";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import FluxoDeCaixa from "./pages/FluxoDeCaixa";
import Clientes from "./pages/Clientes";
import ClienteProfile from "./pages/ClienteProfile";
import Fornecedores from "./pages/Fornecedores";
import FornecedorProfile from "./pages/FornecedorProfile";
import ContasBancarias from "./pages/ContasBancarias";
import Contabilidade from "./pages/Contabilidade";
import PlanoDeContas from "./pages/contabilidade/PlanoDeContas";
import LancamentosPage from "./pages/contabilidade/Lancamentos";
import BalancetePage from "./pages/contabilidade/Balancete";
import RazaoPage from "./pages/contabilidade/Razao";
import BalancoPage from "./pages/contabilidade/BalancoPatrimonial";
import DfcPage from "./pages/contabilidade/Dfc";
import PeriodosFiscaisPage from "./pages/contabilidade/PeriodosFiscais";
import Controladoria from "./pages/Controladoria";
import OrcamentoPage from "./pages/controladoria/Orcamento";
import OrcadoVsRealizadoPage from "./pages/controladoria/OrcadoVsRealizado";
import ForecastPage from "./pages/controladoria/Forecast";
import IndicadoresPage from "./pages/controladoria/Indicadores";
import Fiscal from "./pages/Fiscal";
import Conciliacao from "./pages/Conciliacao";
import Pessoas from "./pages/Pessoas";
import PessoaProfile from "./pages/PessoaProfile";
import Configuracoes from "./pages/Configuracoes";
import GatewayConfig from "./pages/GatewayConfig";
import NotFound from "./pages/NotFound";
import { moduloAtivo } from "@/config/negocio";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      {moduloAtivo("vendas") && <Route path="/vendas" element={<Vendas />} />}
                      {moduloAtivo("vendas") && <Route path="/vendas/:id" element={<VendaProfile />} />}
                      {moduloAtivo("receitas") && <Route path="/receitas" element={<Receitas />} />}
                      {moduloAtivo("despesas") && <Route path="/despesas" element={<Despesas />} />}
                      {moduloAtivo("fluxoDeCaixa") && <Route path="/fluxo-de-caixa" element={<FluxoDeCaixa />} />}
                      {moduloAtivo("clientes") && <Route path="/clientes" element={<Clientes />} />}
                      {moduloAtivo("clientes") && <Route path="/clientes/:id" element={<ClienteProfile />} />}
                      {moduloAtivo("fornecedores") && <Route path="/fornecedores" element={<Fornecedores />} />}
                      {moduloAtivo("fornecedores") && <Route path="/fornecedores/:id" element={<FornecedorProfile />} />}
                      {moduloAtivo("contasBancarias") && <Route path="/contas-bancarias" element={<ContasBancarias />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade" element={<Contabilidade />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade/plano-de-contas" element={<PlanoDeContas />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade/lancamentos" element={<LancamentosPage />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade/balancete" element={<BalancetePage />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade/razao" element={<RazaoPage />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade/balanco" element={<BalancoPage />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade/dfc" element={<DfcPage />} />}
                      {moduloAtivo("contabilidade") && <Route path="/contabilidade/periodos" element={<PeriodosFiscaisPage />} />}
                      {moduloAtivo("controladoria") && <Route path="/controladoria" element={<Controladoria />} />}
                      {moduloAtivo("controladoria") && <Route path="/controladoria/orcamento" element={<OrcamentoPage />} />}
                      {moduloAtivo("controladoria") && <Route path="/controladoria/orcado-vs-realizado" element={<OrcadoVsRealizadoPage />} />}
                      {moduloAtivo("controladoria") && <Route path="/controladoria/forecast" element={<ForecastPage />} />}
                      {moduloAtivo("controladoria") && <Route path="/controladoria/indicadores" element={<IndicadoresPage />} />}
                      {moduloAtivo("fiscal") && <Route path="/fiscal" element={<Fiscal />} />}
                      {moduloAtivo("conciliacao") && <Route path="/conciliacao" element={<Conciliacao />} />}
                      {moduloAtivo("pessoas") && <Route path="/pessoas" element={<Pessoas />} />}
                      {moduloAtivo("pessoas") && <Route path="/pessoas/:id" element={<PessoaProfile />} />}
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      <Route path="/configuracoes/gateways/novo" element={<GatewayConfig />} />
                      <Route path="/configuracoes/gateways/:id" element={<GatewayConfig />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
