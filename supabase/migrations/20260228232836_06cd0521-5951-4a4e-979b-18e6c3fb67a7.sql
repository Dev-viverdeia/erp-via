
CREATE OR REPLACE FUNCTION public.fn_revenue_expense_monthly()
RETURNS TABLE(month_label text, receita numeric, despesa numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
BEGIN
  v_company_id := fn_get_user_company_id();

  RETURN QUERY
  WITH months AS (
    SELECT
      to_char(d, 'Mon/YY') AS label,
      date_trunc('month', d)::date AS month_start,
      (date_trunc('month', d) + interval '1 month' - interval '1 day')::date AS month_end
    FROM generate_series(
      date_trunc('month', now()) - interval '5 months',
      date_trunc('month', now()),
      interval '1 month'
    ) AS d
  ),
  rev AS (
    SELECT
      date_trunc('month', ri.paid_date)::date AS m,
      COALESCE(SUM(ri.paid_amount), 0) AS total
    FROM revenue_installments ri
    JOIN revenues r ON r.id = ri.revenue_id
    WHERE r.company_id = v_company_id
      AND r.deleted_at IS NULL
      AND ri.status = 'paid'
      AND ri.paid_date >= (date_trunc('month', now()) - interval '5 months')::date
    GROUP BY date_trunc('month', ri.paid_date)
  ),
  exp AS (
    SELECT
      date_trunc('month', e.paid_date)::date AS m,
      COALESCE(SUM(e.amount), 0) AS total
    FROM expenses e
    WHERE e.company_id = v_company_id
      AND e.deleted_at IS NULL
      AND e.status = 'paid'
      AND e.paid_date >= (date_trunc('month', now()) - interval '5 months')::date
    GROUP BY date_trunc('month', e.paid_date)
  )
  SELECT
    months.label,
    COALESCE(rev.total, 0)::numeric AS receita,
    COALESCE(exp.total, 0)::numeric AS despesa
  FROM months
  LEFT JOIN rev ON rev.m = months.month_start
  LEFT JOIN exp ON exp.m = months.month_start
  ORDER BY months.month_start;
END;
$function$;
