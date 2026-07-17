
-- =============================================
-- MIGRATION 001: Helper Function + Tabelas Core
-- =============================================

-- 1. Trigger function para auto-update de updated_at
CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Tabela companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  tax_regime TEXT NOT NULL DEFAULT 'lucro_real',
  default_currency TEXT NOT NULL DEFAULT 'BRL',
  fiscal_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 3. Tabela users (profiles) — SEM role para auth (role é descritivo apenas)
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 4. Helper function SECURITY DEFINER para evitar recursão no RLS
CREATE OR REPLACE FUNCTION public.fn_get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- 5. Tabela partners
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'customer' CHECK (type IN ('customer', 'vendor', 'both')),
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address JSONB DEFAULT '{}',
  bank_info JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trg_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 6. Tabela bank_accounts
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  agency TEXT,
  account_number TEXT,
  account_type TEXT DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'investment')),
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- 7. Trigger para auto-criar perfil do usuário + company ao signup
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Cria uma company padrão para o novo usuário
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'))
  RETURNING id INTO new_company_id;

  -- Cria o perfil do usuário vinculado à company
  INSERT INTO public.users (id, company_id, name, email)
  VALUES (
    NEW.id,
    new_company_id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- 8. RLS em todas as tabelas

-- companies: usuários só veem sua própria company
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (id = public.fn_get_user_company_id());

CREATE POLICY "Users can update own company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (id = public.fn_get_user_company_id());

-- users: perfis da mesma company
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (company_id = public.fn_get_user_company_id());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view partners"
  ON public.partners FOR SELECT
  TO authenticated
  USING (company_id = public.fn_get_user_company_id());

CREATE POLICY "Users can create partners"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.fn_get_user_company_id());

CREATE POLICY "Users can update partners"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (company_id = public.fn_get_user_company_id());

CREATE POLICY "Users can delete partners"
  ON public.partners FOR DELETE
  TO authenticated
  USING (company_id = public.fn_get_user_company_id());

-- bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank accounts"
  ON public.bank_accounts FOR SELECT
  TO authenticated
  USING (company_id = public.fn_get_user_company_id());

CREATE POLICY "Users can create bank accounts"
  ON public.bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.fn_get_user_company_id());

CREATE POLICY "Users can update bank accounts"
  ON public.bank_accounts FOR UPDATE
  TO authenticated
  USING (company_id = public.fn_get_user_company_id());

CREATE POLICY "Users can delete bank accounts"
  ON public.bank_accounts FOR DELETE
  TO authenticated
  USING (company_id = public.fn_get_user_company_id());
