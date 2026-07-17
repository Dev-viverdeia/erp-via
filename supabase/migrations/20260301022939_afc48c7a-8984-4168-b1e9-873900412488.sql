
-- Fix revenues gateway constraint to allow 'manual' and NULL
ALTER TABLE revenues DROP CONSTRAINT IF EXISTS revenues_gateway_check;
ALTER TABLE revenues ADD CONSTRAINT revenues_gateway_check 
  CHECK (gateway IS NULL OR gateway = ANY (ARRAY['appmax', 'hubla', 'manual']));

-- Fix audit_logs action constraint to allow all TG_OP values
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check 
  CHECK (action = ANY (ARRAY['INSERT', 'UPDATE', 'DELETE', 'insert', 'update', 'delete']));
