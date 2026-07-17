import { useState, useEffect } from "react";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";

const TAX_REGIMES: Record<string, string> = {
  lucro_real: "Lucro Real",
  lucro_presumido: "Lucro Presumido",
  simples_nacional: "Simples Nacional",
};

export function CompanyProfileTab() {
  const { data: company, isLoading, updateCompany, isUpdating } = useCompanyProfile();
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [taxRegime, setTaxRegime] = useState("lucro_real");

  useEffect(() => {
    if (company) {
      setName(company.name);
      setCnpj(company.cnpj ?? "");
      setTaxRegime(company.tax_regime);
    }
  }, [company]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const handleSave = () => {
    updateCompany({ name, cnpj: cnpj || null, tax_regime: taxRegime });
  };

  const hasChanges =
    company && (name !== company.name || (cnpj || null) !== (company.cnpj || null) || taxRegime !== company.tax_regime);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Perfil da Empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-cnpj">CNPJ</Label>
            <Input id="company-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <Label>Regime Tributário</Label>
            <Select value={taxRegime} onValueChange={setTaxRegime}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_REGIMES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Moeda Padrão</Label>
            <Input value={company?.default_currency ?? "BRL"} disabled />
          </div>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isUpdating} size="sm">
          <Save className="mr-2 h-4 w-4" />
          {isUpdating ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}
