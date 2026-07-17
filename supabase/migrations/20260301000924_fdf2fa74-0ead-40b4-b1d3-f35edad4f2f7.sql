
-- RPC para seed do plano de contas padrao (Lucro Real - servicos digitais)
CREATE OR REPLACE FUNCTION public.fn_seed_chart_of_accounts(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
  -- level 1
  v_ativo uuid; v_passivo uuid; v_pl uuid; v_receitas uuid; v_despesas uuid;
  -- level 2
  v_ac uuid; v_anc uuid;
  v_pc uuid;
  v_ro uuid; v_or uuid;
  v_do uuid; v_da uuid; v_df uuid; v_di uuid;
BEGIN
  -- Idempotent: skip if already seeded
  SELECT count(*) INTO v_count FROM chart_of_accounts WHERE company_id = p_company_id;
  IF v_count > 0 THEN RETURN; END IF;

  -- 1 ATIVO
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '1', 'ATIVO', 'asset', 'debit', false, null) RETURNING id INTO v_ativo;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '1.1', 'Ativo Circulante', 'asset', 'debit', false, v_ativo) RETURNING id INTO v_ac;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '1.1.1', 'Caixa e Equivalentes', 'asset', 'debit', true, v_ac),
    (p_company_id, '1.1.2', 'Bancos Conta Movimento', 'asset', 'debit', true, v_ac),
    (p_company_id, '1.1.3', 'Contas a Receber', 'asset', 'debit', true, v_ac),
    (p_company_id, '1.1.4', 'PIS a Recuperar', 'asset', 'debit', true, v_ac),
    (p_company_id, '1.1.5', 'COFINS a Recuperar', 'asset', 'debit', true, v_ac),
    (p_company_id, '1.1.6', 'IR Retido na Fonte', 'asset', 'debit', true, v_ac);
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '1.2', 'Ativo Nao Circulante', 'asset', 'debit', false, v_ativo) RETURNING id INTO v_anc;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '1.2.1', 'Imobilizado', 'asset', 'debit', true, v_anc),
    (p_company_id, '1.2.2', 'Intangivel', 'asset', 'debit', true, v_anc);

  -- 2 PASSIVO
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '2', 'PASSIVO', 'liability', 'credit', false, null) RETURNING id INTO v_passivo;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '2.1', 'Passivo Circulante', 'liability', 'credit', false, v_passivo) RETURNING id INTO v_pc;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '2.1.1', 'Fornecedores', 'liability', 'credit', true, v_pc),
    (p_company_id, '2.1.2', 'Obrigacoes Trabalhistas', 'liability', 'credit', true, v_pc),
    (p_company_id, '2.1.3', 'Obrigacoes Tributarias', 'liability', 'credit', true, v_pc),
    (p_company_id, '2.1.4', 'Receita Diferida', 'liability', 'credit', true, v_pc),
    (p_company_id, '2.1.5', 'PIS a Recolher', 'liability', 'credit', true, v_pc),
    (p_company_id, '2.1.6', 'COFINS a Recolher', 'liability', 'credit', true, v_pc),
    (p_company_id, '2.1.7', 'IRPJ a Recolher', 'liability', 'credit', true, v_pc),
    (p_company_id, '2.1.8', 'CSLL a Recolher', 'liability', 'credit', true, v_pc);

  -- 3 PATRIMONIO LIQUIDO
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '3', 'PATRIMONIO LIQUIDO', 'equity', 'credit', false, null) RETURNING id INTO v_pl;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '3.1', 'Capital Social', 'equity', 'credit', true, v_pl),
    (p_company_id, '3.2', 'Lucros Acumulados', 'equity', 'credit', true, v_pl);

  -- 4 RECEITAS
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '4', 'RECEITAS', 'revenue', 'credit', false, null) RETURNING id INTO v_receitas;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '4.1', 'Receita Operacional', 'revenue', 'credit', false, v_receitas) RETURNING id INTO v_ro;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '4.1.1', 'Receita de Servicos', 'revenue', 'credit', true, v_ro),
    (p_company_id, '4.1.2', 'Receita de Assinaturas', 'revenue', 'credit', true, v_ro);
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '4.2', 'Outras Receitas', 'revenue', 'credit', false, v_receitas) RETURNING id INTO v_or;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '4.2.1', 'Receitas Financeiras', 'revenue', 'credit', true, v_or);

  -- 5 DESPESAS
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '5', 'DESPESAS', 'expense', 'debit', false, null) RETURNING id INTO v_despesas;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '5.1', 'Despesas Operacionais', 'expense', 'debit', false, v_despesas) RETURNING id INTO v_do;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '5.1.1', 'Servicos de Terceiros PJ', 'expense', 'debit', true, v_do),
    (p_company_id, '5.1.2', 'Marketing e Publicidade', 'expense', 'debit', true, v_do),
    (p_company_id, '5.1.3', 'Tecnologia e Software', 'expense', 'debit', true, v_do),
    (p_company_id, '5.1.4', 'Taxas de Gateway', 'expense', 'debit', true, v_do);
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '5.2', 'Despesas Administrativas', 'expense', 'debit', false, v_despesas) RETURNING id INTO v_da;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '5.2.1', 'Salarios e Encargos', 'expense', 'debit', true, v_da),
    (p_company_id, '5.2.2', 'Despesas Gerais', 'expense', 'debit', true, v_da);
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '5.3', 'Despesas Financeiras', 'expense', 'debit', false, v_despesas) RETURNING id INTO v_df;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '5.3.1', 'Juros e Multas', 'expense', 'debit', true, v_df),
    (p_company_id, '5.3.2', 'Taxas Bancarias', 'expense', 'debit', true, v_df);
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id)
  VALUES (p_company_id, '5.4', 'Impostos sobre Receita', 'expense', 'debit', false, v_despesas) RETURNING id INTO v_di;
  INSERT INTO chart_of_accounts (company_id, code, name, type, nature, is_analytical, parent_id) VALUES
    (p_company_id, '5.4.1', 'PIS sobre Receita', 'expense', 'debit', true, v_di),
    (p_company_id, '5.4.2', 'COFINS sobre Receita', 'expense', 'debit', true, v_di);
END;
$$;

-- RPC para criar lancamento contabil com validacao de partida dobrada
CREATE OR REPLACE FUNCTION public.fn_create_journal_entry(
  p_company_id uuid,
  p_entry_date date,
  p_description text,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_is_automatic boolean DEFAULT false,
  p_lines jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_debit numeric;
  v_total_credit numeric;
  v_line_count integer;
  v_entry_id uuid;
  v_fiscal_period_id uuid;
  v_line jsonb;
  v_account_ok boolean;
BEGIN
  -- Validate minimum 2 lines
  v_line_count := jsonb_array_length(p_lines);
  IF v_line_count < 2 THEN
    RAISE EXCEPTION 'Lancamento deve ter pelo menos 2 linhas (partidas)';
  END IF;

  -- Calculate totals
  SELECT
    COALESCE(SUM((l->>'debit_amount')::numeric), 0),
    COALESCE(SUM((l->>'credit_amount')::numeric), 0)
  INTO v_total_debit, v_total_credit
  FROM jsonb_array_elements(p_lines) AS l;

  -- Validate double-entry
  IF v_total_debit != v_total_credit THEN
    RAISE EXCEPTION 'Partida dobrada: total debito (%) deve ser igual ao total credito (%)', v_total_debit, v_total_credit;
  END IF;

  IF v_total_debit = 0 THEN
    RAISE EXCEPTION 'Lancamento deve ter valor maior que zero';
  END IF;

  -- Validate each line
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF (v_line->>'debit_amount')::numeric < 0 OR (v_line->>'credit_amount')::numeric < 0 THEN
      RAISE EXCEPTION 'Valores de debito e credito devem ser >= 0';
    END IF;
    IF (v_line->>'debit_amount')::numeric = 0 AND (v_line->>'credit_amount')::numeric = 0 THEN
      RAISE EXCEPTION 'Cada linha deve ter debito ou credito > 0';
    END IF;
    -- Validate account exists and is analytical
    SELECT is_analytical INTO v_account_ok
    FROM chart_of_accounts
    WHERE id = (v_line->>'account_id')::uuid AND company_id = p_company_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conta contabil nao encontrada: %', v_line->>'account_id';
    END IF;
    IF NOT v_account_ok THEN
      RAISE EXCEPTION 'Conta % nao e analitica', v_line->>'account_id';
    END IF;
  END LOOP;

  -- Check fiscal period (optional - only block if a CLOSED period exists for this date)
  SELECT id INTO v_fiscal_period_id
  FROM fiscal_periods
  WHERE company_id = p_company_id
    AND p_entry_date BETWEEN start_date AND end_date
    AND status = 'closed';
  IF FOUND THEN
    RAISE EXCEPTION 'Periodo fiscal fechado para a data %', p_entry_date;
  END IF;

  -- Find open fiscal period (optional link)
  SELECT id INTO v_fiscal_period_id
  FROM fiscal_periods
  WHERE company_id = p_company_id
    AND p_entry_date BETWEEN start_date AND end_date
    AND status = 'open'
  LIMIT 1;

  -- Insert journal entry
  INSERT INTO journal_entries (company_id, entry_date, description, reference_type, reference_id, is_automatic, fiscal_period_id, created_by)
  VALUES (p_company_id, p_entry_date, p_description, p_reference_type, p_reference_id, p_is_automatic, v_fiscal_period_id, auth.uid())
  RETURNING id INTO v_entry_id;

  -- Insert lines
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description, partner_id, cost_center_id)
  SELECT
    v_entry_id,
    (l->>'account_id')::uuid,
    (l->>'debit_amount')::numeric,
    (l->>'credit_amount')::numeric,
    l->>'description',
    NULLIF(l->>'partner_id', '')::uuid,
    NULLIF(l->>'cost_center_id', '')::uuid
  FROM jsonb_array_elements(p_lines) AS l;

  RETURN v_entry_id;
END;
$$;
