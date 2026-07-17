
-- =============================================
-- MIGRATION 003: Tabelas Contábeis e Fiscais
-- =============================================

-- 1. chart_of_accounts
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  nature TEXT NOT NULL CHECK (nature IN ('debit', 'credit')),
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_analytical BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- Índice para busca por código dentro da company
CREATE UNIQUE INDEX idx_chart_of_accounts_code ON public.chart_of_accounts(company_id, code);

-- 2. fiscal_periods
CREATE TABLE public.fiscal_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed')),
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_fiscal_periods_updated_at
  BEFORE UPDATE ON public.fiscal_periods
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE UNIQUE INDEX idx_fiscal_periods_unique ON public.fiscal_periods(company_id, year, month);

-- 3. journal_entries
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  is_automatic BOOLEAN NOT NULL DEFAULT FALSE,
  fiscal_period_id UUID REFERENCES public.fiscal_periods(id),
  is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_by UUID REFERENCES public.journal_entries(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 4. journal_entry_lines
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  debit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  partner_id UUID REFERENCES public.partners(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. tax_entries
CREATE TABLE public.tax_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  fiscal_period_id UUID REFERENCES public.fiscal_periods(id),
  tax_type TEXT NOT NULL CHECK (tax_type IN ('pis', 'cofins', 'irpj', 'csll')),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  base_amount DECIMAL(15,2) NOT NULL,
  rate DECIMAL(8,4) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. withholding_taxes
CREATE TABLE public.withholding_taxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id),
  tax_type TEXT NOT NULL CHECK (tax_type IN ('ir', 'pis', 'cofins', 'csll')),
  base_amount DECIMAL(15,2) NOT NULL,
  rate DECIMAL(8,4) NOT NULL,
  withheld_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. RLS

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chart of accounts" ON public.chart_of_accounts FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create chart of accounts" ON public.chart_of_accounts FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update chart of accounts" ON public.chart_of_accounts FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete chart of accounts" ON public.chart_of_accounts FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view fiscal periods" ON public.fiscal_periods FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create fiscal periods" ON public.fiscal_periods FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update fiscal periods" ON public.fiscal_periods FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view journal entries" ON public.journal_entries FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create journal entries" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update journal entries" ON public.journal_entries FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view journal entry lines" ON public.journal_entry_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.company_id = public.fn_get_user_company_id()));
CREATE POLICY "Users can create journal entry lines" ON public.journal_entry_lines FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.company_id = public.fn_get_user_company_id()));
CREATE POLICY "Users can update journal entry lines" ON public.journal_entry_lines FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.company_id = public.fn_get_user_company_id()));

ALTER TABLE public.tax_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tax entries" ON public.tax_entries FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create tax entries" ON public.tax_entries FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update tax entries" ON public.tax_entries FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.withholding_taxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view withholding taxes" ON public.withholding_taxes FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create withholding taxes" ON public.withholding_taxes FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update withholding taxes" ON public.withholding_taxes FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
