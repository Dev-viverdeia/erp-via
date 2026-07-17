-- Allow users to delete their own tax entries (needed for recalculating apurações)
CREATE POLICY "Users can delete tax entries"
ON public.tax_entries
FOR DELETE
USING (company_id = fn_get_user_company_id());

-- Allow users to delete their own withholding taxes
CREATE POLICY "Users can delete withholding taxes"
ON public.withholding_taxes
FOR DELETE
USING (company_id = fn_get_user_company_id());