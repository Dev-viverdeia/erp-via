import { supabase } from "@/integrations/supabase/client";

/**
 * Finds a chart_of_accounts ID by code for the current company.
 */
async function findAccountByCode(companyId: string, code: string): Promise<string | null> {
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("company_id", companyId)
    .eq("code", code)
    .eq("is_active", true)
    .eq("is_analytical", true)
    .single();
  return data?.id || null;
}

/**
 * Creates an automatic journal entry for expense payment.
 * D - Expense account (5.x) / C - Bank (1.1.2)
 */
export async function createExpenseJournalEntry(
  companyId: string,
  expenseDescription: string,
  amount: number,
  paidDate: string,
  expenseId: string,
  categoryAccountCode?: string,
) {
  const bankAccountId = await findAccountByCode(companyId, "1.1.2");
  const expenseAccountId = categoryAccountCode
    ? await findAccountByCode(companyId, categoryAccountCode)
    : await findAccountByCode(companyId, "5.1.1");

  if (!bankAccountId || !expenseAccountId) return;

  await supabase.rpc("fn_create_journal_entry", {
    p_company_id: companyId,
    p_entry_date: paidDate,
    p_description: `Pgto despesa: ${expenseDescription}`,
    p_reference_type: "expense",
    p_reference_id: expenseId,
    p_is_automatic: true,
    p_lines: JSON.stringify([
      { account_id: expenseAccountId, debit_amount: amount, credit_amount: 0 },
      { account_id: bankAccountId, debit_amount: 0, credit_amount: amount },
    ]),
  } as any);
}

/**
 * Creates an automatic journal entry for revenue installment payment.
 * D - Bank (1.1.2) / C - Revenue (4.1.1)
 * For recurring: also D - Deferred Revenue (2.1.4) / C - Accounts Receivable (1.1.3)
 */
export async function createRevenueInstallmentJournalEntry(
  companyId: string,
  amount: number,
  paidDate: string,
  installmentId: string,
  isRecurring: boolean,
) {
  const bankId = await findAccountByCode(companyId, "1.1.2");
  const revenueId = await findAccountByCode(companyId, "4.1.1");

  if (!bankId || !revenueId) return;

  if (isRecurring) {
    const deferredId = await findAccountByCode(companyId, "2.1.4");
    const receivableId = await findAccountByCode(companyId, "1.1.3");
    if (!deferredId || !receivableId) return;

    // Two entries: realize deferred revenue + record bank receipt
    await supabase.rpc("fn_create_journal_entry", {
      p_company_id: companyId,
      p_entry_date: paidDate,
      p_description: `Realização receita diferida - parcela`,
      p_reference_type: "revenue_installment",
      p_reference_id: installmentId,
      p_is_automatic: true,
      p_lines: JSON.stringify([
        { account_id: deferredId, debit_amount: amount, credit_amount: 0 },
        { account_id: revenueId, debit_amount: 0, credit_amount: amount },
        { account_id: bankId, debit_amount: amount, credit_amount: 0 },
        { account_id: receivableId, debit_amount: 0, credit_amount: amount },
      ]),
    } as any);
  } else {
    await supabase.rpc("fn_create_journal_entry", {
      p_company_id: companyId,
      p_entry_date: paidDate,
      p_description: `Recebimento receita à vista`,
      p_reference_type: "revenue_installment",
      p_reference_id: installmentId,
      p_is_automatic: true,
      p_lines: JSON.stringify([
        { account_id: bankId, debit_amount: amount, credit_amount: 0 },
        { account_id: revenueId, debit_amount: 0, credit_amount: amount },
      ]),
    } as any);
  }
}

/**
 * Creates provisioning journal entry for recurring revenue.
 * D - Accounts Receivable (1.1.3) / C - Deferred Revenue (2.1.4)
 */
export async function createRevenueProvisioningJournalEntry(
  companyId: string,
  totalAmount: number,
  contractedDate: string,
  revenueId: string,
) {
  const receivableId = await findAccountByCode(companyId, "1.1.3");
  const deferredId = await findAccountByCode(companyId, "2.1.4");

  if (!receivableId || !deferredId) return;

  await supabase.rpc("fn_create_journal_entry", {
    p_company_id: companyId,
    p_entry_date: contractedDate,
    p_description: `Provisionamento receita recorrente`,
    p_reference_type: "revenue",
    p_reference_id: revenueId,
    p_is_automatic: true,
    p_lines: JSON.stringify([
      { account_id: receivableId, debit_amount: totalAmount, credit_amount: 0 },
      { account_id: deferredId, debit_amount: 0, credit_amount: totalAmount },
    ]),
  } as any);
}
