
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_record_id uuid;
  v_has_company_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'company_id'
  ) INTO v_has_company_id;

  IF v_has_company_id THEN
    v_company_id := CASE WHEN TG_OP IN ('INSERT','UPDATE') 
      THEN (to_jsonb(NEW))->>'company_id' 
      ELSE (to_jsonb(OLD))->>'company_id' END;
  ELSE
    v_company_id := NULL;
  END IF;

  v_record_id := CASE WHEN TG_OP IN ('INSERT','UPDATE') 
    THEN (to_jsonb(NEW))->>'id' 
    ELSE (to_jsonb(OLD))->>'id' END;

  INSERT INTO public.audit_logs (company_id, user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    v_company_id::uuid,
    auth.uid(),
    TG_TABLE_NAME,
    v_record_id::uuid,
    TG_OP::text,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
