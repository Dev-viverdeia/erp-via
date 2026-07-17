
SELECT cron.schedule(
  'mark-overdue-daily',
  '0 6 * * *',
  $$SELECT public.fn_mark_overdue()$$
);
