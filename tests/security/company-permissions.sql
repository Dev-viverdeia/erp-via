-- Run after the solution migrations in an isolated database. Everything rolls back.
BEGIN;
CREATE FUNCTION pg_temp.assert(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'FAIL: %', label; END IF; RAISE NOTICE 'PASS: %', label; END $$;
CREATE FUNCTION pg_temp.denied(statement text, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: %',label; RETURN; END;
  RAISE EXCEPTION 'FAIL (allowed): %',label;
END $$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
('11111111-1111-4111-8111-111111111111','permissions-a@example.invalid','{"company_name":"QA A"}'),
('22222222-2222-4222-8222-222222222222','permissions-b@example.invalid','{"company_name":"QA B"}');
SELECT company_id AS company_a FROM public.users WHERE id='11111111-1111-4111-8111-111111111111' \gset
SELECT company_id AS company_b FROM public.users WHERE id='22222222-2222-4222-8222-222222222222' \gset
SELECT pg_temp.assert(:'company_a'<>:'company_b','signup creates independent companies and profiles');
SET LOCAL ROLE anon;
SELECT pg_temp.denied(format('select public.fn_seed_chart_of_accounts(%L)', :'company_a'),'visitor cannot seed');
SELECT pg_temp.denied('select public.fn_revenue_expense_monthly()','visitor cannot read dashboard');
SELECT pg_temp.denied(format('select public.fn_create_journal_entry(%L,current_date,''QA'')', :'company_a'),'visitor cannot create journal entries');
SELECT pg_temp.assert((SELECT count(*)=0 FROM public.users),'visitor cannot read profiles');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
SELECT public.fn_seed_chart_of_accounts(:'company_a');
SELECT count(*) AS seeded_count FROM chart_of_accounts \gset
SELECT pg_temp.assert(:seeded_count>0,'signed-in member creates own chart');
SELECT public.fn_seed_chart_of_accounts(:'company_a');
SELECT pg_temp.assert((SELECT count(*)=:seeded_count FROM chart_of_accounts),'retry does not duplicate accounts');
SELECT pg_temp.denied(format('select public.fn_seed_chart_of_accounts(%L)', :'company_b'),'member cannot seed other company');
SELECT pg_temp.denied('select public.fn_seed_chart_of_accounts(null)','null company rejected');
SELECT pg_temp.denied(format('update public.users set company_id=%L where id=auth.uid()', :'company_b'),'membership is not client-editable');
SELECT pg_temp.denied('update public.users set role=''admin'' where id=auth.uid()','client cannot change role');
SELECT pg_temp.denied('insert into public.users(id) values(auth.uid())','client cannot recreate membership');
UPDATE public.users SET name='Nome atualizado',avatar_url='https://example.invalid/avatar' WHERE id=auth.uid();
SELECT pg_temp.assert((SELECT name='Nome atualizado' FROM users WHERE id=auth.uid()),'profile presentation remains editable');
SELECT pg_temp.assert((SELECT count(*)=1 FROM users),'profiles isolated by company');
INSERT INTO partners(company_id,name) VALUES (:'company_a','Cliente QA');
SELECT pg_temp.assert((SELECT count(*)=1 FROM partners),'own business write works');
SELECT pg_temp.denied(format('insert into partners(company_id,name) values(%L,''invalid'')', :'company_b'),'foreign business write denied');
SELECT pg_temp.assert((SELECT count(*)=6 FROM public.fn_revenue_expense_monthly()),'dashboard remains available');
SELECT jsonb_build_array(jsonb_build_object('account_id',min(id::text),'debit_amount',10,'credit_amount',0),jsonb_build_object('account_id',max(id::text),'debit_amount',0,'credit_amount',10)) AS lines FROM chart_of_accounts WHERE is_analytical \gset
SELECT public.fn_create_journal_entry(:'company_a',current_date,'QA lançamento',p_lines=>:'lines'::jsonb) AS journal_id \gset
SELECT pg_temp.assert((SELECT count(*)=2 FROM journal_entry_lines WHERE journal_entry_id=:'journal_id'),'legitimate journal inserts balanced lines');
SELECT pg_temp.denied(format('select public.fn_create_journal_entry(%L,current_date,''invalid'',p_lines=>%L::jsonb)', :'company_b', :'lines'),'foreign journal rejected before writes');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
SELECT pg_temp.assert((SELECT count(*)=0 FROM partners),'second company cannot read first company clients');
SELECT pg_temp.assert((SELECT count(*)=0 FROM journal_entries),'second company cannot read first company journal');
SELECT public.fn_seed_chart_of_accounts(:'company_b');
SELECT pg_temp.assert((SELECT count(*)=:seeded_count FROM chart_of_accounts),'second signup remains functional');
RESET ROLE;
SELECT pg_temp.assert((SELECT count(*)=2 FROM public.users WHERE id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')),'signup profiles preserved');
ROLLBACK;
