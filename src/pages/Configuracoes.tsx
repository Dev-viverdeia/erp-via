import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileTab } from "@/components/configuracoes/CompanyProfileTab";
import { AuditLogTab } from "@/components/configuracoes/AuditLogTab";
import { IntegrationsTab } from "@/components/configuracoes/IntegrationsTab";
import { ExpenseCategoriesTab } from "@/components/configuracoes/ExpenseCategoriesTab";
import { CostCentersTab } from "@/components/configuracoes/CostCentersTab";
import { GatewaysTab } from "@/components/configuracoes/GatewaysTab";

const Configuracoes = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-heading text-foreground">Configurações</h1>
      <p className="text-sm text-muted-foreground">Preferências do sistema e auditoria</p>
    </div>
    <Tabs defaultValue="empresa">
      <TabsList>
        <TabsTrigger value="empresa">Empresa</TabsTrigger>
        <TabsTrigger value="categorias">Categorias</TabsTrigger>
        <TabsTrigger value="centros-custo">Centros de Custo</TabsTrigger>
        <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        <TabsTrigger value="gateways">Gateways</TabsTrigger>
        <TabsTrigger value="integracoes">Integrações</TabsTrigger>
      </TabsList>
      <TabsContent value="empresa">
        <CompanyProfileTab />
      </TabsContent>
      <TabsContent value="categorias">
        <ExpenseCategoriesTab />
      </TabsContent>
      <TabsContent value="centros-custo">
        <CostCentersTab />
      </TabsContent>
      <TabsContent value="auditoria">
        <AuditLogTab />
      </TabsContent>
      <TabsContent value="gateways">
        <GatewaysTab />
      </TabsContent>
      <TabsContent value="integracoes">
        <IntegrationsTab />
      </TabsContent>
    </Tabs>
  </div>
);

export default Configuracoes;
