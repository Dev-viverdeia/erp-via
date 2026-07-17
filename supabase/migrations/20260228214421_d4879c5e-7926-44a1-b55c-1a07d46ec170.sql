
-- =============================================
-- MIGRATION 004: Tabelas de Pessoas e Integração
-- =============================================

-- 1. employees
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id),
  contract_type TEXT NOT NULL DEFAULT 'pj' CHECK (contract_type IN ('pj', 'clt')),
  role TEXT,
  department TEXT,
  salary DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  bank_info JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 2. employee_contracts
CREATE TABLE public.employee_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT 'pj' CHECK (contract_type IN ('pj', 'clt')),
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_value DECIMAL(15,2) NOT NULL,
  description TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_employee_contracts_updated_at
  BEFORE UPDATE ON public.employee_contracts
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 3. webhook_logs
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  source TEXT NOT NULL CHECK (source IN ('crm', 'appmax', 'hubla')),
  event_type TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. audit_logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. integration_configs
CREATE TABLE public.integration_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('appmax', 'hubla', 'crm')),
  api_key_encrypted TEXT,
  webhook_secret TEXT,
  endpoint_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 6. RLS

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view employees" ON public.employees FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update employees" ON public.employees FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete employees" ON public.employees FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view employee contracts" ON public.employee_contracts FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create employee contracts" ON public.employee_contracts FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update employee contracts" ON public.employee_contracts FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete employee contracts" ON public.employee_contracts FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view webhook logs" ON public.webhook_logs FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create webhook logs" ON public.webhook_logs FOR INSERT TO authenticated WITH CHECK (TRUE);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view integration configs" ON public.integration_configs FOR SELECT TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can create integration configs" ON public.integration_configs FOR INSERT TO authenticated WITH CHECK (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can update integration configs" ON public.integration_configs FOR UPDATE TO authenticated USING (company_id = public.fn_get_user_company_id());
CREATE POLICY "Users can delete integration configs" ON public.integration_configs FOR DELETE TO authenticated USING (company_id = public.fn_get_user_company_id());
