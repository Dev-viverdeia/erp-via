
-- Fix: substituir policy permissiva de webhook_logs INSERT
-- Webhooks serão inseridos via Edge Functions com service_role key, não precisam de policy INSERT para authenticated
DROP POLICY "Users can create webhook logs" ON public.webhook_logs;

-- Webhook logs INSERT será feito apenas via service_role (Edge Functions), sem policy INSERT para authenticated
