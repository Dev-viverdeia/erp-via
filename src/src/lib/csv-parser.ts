export interface ParsedTransaction {
  date: string; // yyyy-mm-dd
  description: string;
  amount: number;
  type: "credit" | "debit";
  import_ref: string;
}

function detectSeparator(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseBrDate(raw: string): string {
  const trimmed = raw.trim();
  // dd/mm/yyyy or dd-mm-yyyy
  const match = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  // yyyy-mm-dd already
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return trimmed;
}

function parseBrNumber(raw: string): number {
  const trimmed = raw.trim().replace(/\s/g, "");
  // Remove currency symbol
  const cleaned = trimmed.replace(/R\$\s?/gi, "");
  // BR format: 1.234,56 → remove dots, replace comma with dot
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }
  return parseFloat(cleaned);
}

function generateImportRef(date: string, description: string, amount: number): string {
  const raw = `${date}|${description.trim()}|${amount.toFixed(2)}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `csv_${Math.abs(hash).toString(36)}`;
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseCsv(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const sep = detectSeparator(text);
  const headers = lines[0].split(sep);

  const dateIdx = findColumnIndex(headers, ["data", "date", "dt"]);
  const descIdx = findColumnIndex(headers, ["descricao", "historico", "description", "desc", "hist"]);
  const valueIdx = findColumnIndex(headers, ["valor", "value", "amount", "vlr"]);
  const debitIdx = findColumnIndex(headers, ["debito", "debit", "saida"]);
  const creditIdx = findColumnIndex(headers, ["credito", "credit", "entrada"]);

  if (dateIdx === -1) throw new Error("Coluna de data não encontrada no CSV");
  if (descIdx === -1 && headers.length < 3) throw new Error("Coluna de descrição não encontrada no CSV");

  const results: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep);
    if (cols.length < 2) continue;

    const dateRaw = cols[dateIdx]?.trim();
    if (!dateRaw) continue;

    const date = parseBrDate(dateRaw);
    const description = (cols[descIdx !== -1 ? descIdx : 1] || "").trim().replace(/^"|"$/g, "");

    let amount: number;
    let type: "credit" | "debit";

    if (debitIdx !== -1 && creditIdx !== -1) {
      // Separate debit/credit columns
      const debitVal = cols[debitIdx]?.trim();
      const creditVal = cols[creditIdx]?.trim();
      if (creditVal && parseBrNumber(creditVal) !== 0) {
        amount = Math.abs(parseBrNumber(creditVal));
        type = "credit";
      } else if (debitVal && parseBrNumber(debitVal) !== 0) {
        amount = Math.abs(parseBrNumber(debitVal));
        type = "debit";
      } else {
        continue;
      }
    } else if (valueIdx !== -1) {
      // Single value column
      const raw = parseBrNumber(cols[valueIdx] || "0");
      if (raw === 0 || isNaN(raw)) continue;
      amount = Math.abs(raw);
      type = raw >= 0 ? "credit" : "debit";
    } else {
      continue;
    }

    const import_ref = generateImportRef(date, description, amount);
    results.push({ date, description, amount, type, import_ref });
  }

  return results;
}
