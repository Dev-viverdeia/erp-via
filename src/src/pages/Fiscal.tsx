import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PisCofinsTab from "@/components/fiscal/PisCofinsTab";
import IrpjCsllTab from "@/components/fiscal/IrpjCsllTab";
import RetencoesTab from "@/components/fiscal/RetencoesTab";

const Fiscal = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-heading text-foreground">Fiscal</h1>
      <p className="text-sm text-muted-foreground">Apuração de impostos, retenções e obrigações fiscais</p>
    </div>

    <Tabs defaultValue="pis-cofins">
      <TabsList>
        <TabsTrigger value="pis-cofins">PIS/COFINS</TabsTrigger>
        <TabsTrigger value="irpj-csll">IRPJ/CSLL</TabsTrigger>
        <TabsTrigger value="retencoes">Retenções na Fonte</TabsTrigger>
      </TabsList>
      <TabsContent value="pis-cofins"><PisCofinsTab /></TabsContent>
      <TabsContent value="irpj-csll"><IrpjCsllTab /></TabsContent>
      <TabsContent value="retencoes"><RetencoesTab /></TabsContent>
    </Tabs>
  </div>
);

export default Fiscal;
