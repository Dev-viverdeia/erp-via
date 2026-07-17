
-- =============================================
-- MIGRATION 002: Tabelas Financeiras
-- =============================================

-- 1. expense_categories (hierárquica)
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  account_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 2. cost_centers
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 3. revenues
CREATE TABLE public.revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id),
  sale_id TEXT,
  payment_type TEXT NOT NULL DEFAULT 'pix' CHECK (payment_type IN ('pix', 'card', 'recurring')),
  total_amount DECIMAL(15,2) NOT NULL,
  installments_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  gateway TEXT CHECK (gateway IN ('appmax', 'hubla')),
  gateway_ref TEXT,
  contracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trg_revenues_updated_at
  BEFORE UPDATE ON public.revenues
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 4. revenue_installments
CREATE TABLE public.revenue_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  revenue_id UUID NOT NULL REFERENCES public.revenues(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'provisioned' CHECK (status IN ('provisioned', 'paid', 'overdue', 'cancelled')),
  gateway_transaction_id TEXT,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  paid_amount DECIMAL(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_revenue_installments_updated_at
  BEFORE UPDATE ON public.revenue_installments
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 5. expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id),
  category_id UUID REFERENCES public.expense_categories(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('monthly', 'quarterly', 'yearly')),
  pis_cofins_credit BOOLEAN NOT NULL DEFAULT FALSE,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 6. bank_transactions
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  reconciled_with_type TEXT,
  reconciled_with_id UUID,
  import_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 7. RLS em todas as tabelas

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view expense categories" ON public.expense_categories FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create expense categories" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update expense categories" ON public.expense_categories FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete expense categories" ON public.expense_categories FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view cost centers" ON public.cost_centers FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create cost centers" ON public.cost_centers FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update cost centers" ON public.cost_centers FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete cost centers" ON public.cost_centers FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view revenues" ON public.revenues FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create revenues" ON public.revenues FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update revenues" ON public.revenues FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete revenues" ON public.revenues FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());

-- revenue_installments: RLS via join com revenues (company_id está na revenue)
ALTER TABLE public.revenue_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view revenue installments" ON public.revenue_installments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.revenues r WHERE r.id = revenue_id AND r.company_id = public.fn_get_user_company_id()));
CREATE POLICY "Users can create revenue installments" ON public.revenue_installments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.revenues r WHERE r.id = revenue_id AND r.company_id = public.fn_get_user_company_id()));
CREATE POLICY "Users can update revenue installments" ON public.revenue_installments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.revenues r WHERE r.id = revenue_id AND r.company_id = public.fn_get_user_company_id()));
CREATE POLICY "Users can delete revenue installments" ON public.revenue_installments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.revenues r WHERE r.id = revenue_id AND r.company_id = public.fn_get_user_company_id()));

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view expenses" ON public.expenses FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view bank transactions" ON public.bank_transactions FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create bank transactions" ON public.bank_transactions FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update bank transactions" ON public.bank_transactions FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete bank transactions" ON public.bank_transactions FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());
