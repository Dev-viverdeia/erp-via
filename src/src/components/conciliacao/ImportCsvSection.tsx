import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Check } from "lucide-react";
import { parseCsv, type ParsedTransaction } from "@/lib/csv-parser";
import { useImportBankTransactions } from "@/hooks/useBankTransactions";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

interface Props {
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
}

export function ImportCsvSection({ selectedAccountId, onAccountChange }: Props) {
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: accounts = [] } = useBankAccounts();
  const importMutation = useImportBankTransactions();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseCsv(text);
        setPreview(parsed);
        if (parsed.length === 0) toast.warning("Nenhuma transação encontrada no CSV");
      } catch (err: any) {
        toast.error(err.message || "Erro ao parsear CSV");
        setPreview([]);
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImport = () => {
    if (!selectedAccountId) {
      toast.error("Selecione uma conta bancária");
      return;
    }
    importMutation.mutate(
      { bankAccountId: selectedAccountId, transactions: preview },
      { onSuccess: () => { setPreview([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; } }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5" /> Importar Extrato CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-64">
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Conta Bancária</label>
            <Select value={selectedAccountId} onValueChange={onAccountChange}>
              <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.is_active).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.bank_name} — {a.account_number || "S/N"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileText className="h-4 w-4 mr-2" /> {fileName || "Selecionar CSV"}
            </Button>
          </div>
          {preview.length > 0 && (
            <Button onClick={handleImport} disabled={importMutation.isPending || !selectedAccountId}>
              <Check className="h-4 w-4 mr-2" /> Importar {preview.length} transações
            </Button>
          )}
        </div>

        {preview.length > 0 && (
          <div className="rounded-md border border-border max-h-64 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 50).map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                    <TableCell>
                    <StatusBadge status={t.type === "credit" ? "success" : "error"}>
                        {t.type === "credit" ? "Crédito" : "Débito"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {preview.length > 50 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Mostrando 50 de {preview.length} transações
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
