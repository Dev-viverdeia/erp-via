import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().split("T")[0];

  try {
    // Update overdue revenue installments
    const { data: overdueInstallments, error: instError } = await supabase
      .from("revenue_installments")
      .update({ status: "overdue" })
      .eq("status", "provisioned")
      .lt("due_date", today)
      .select("id");

    if (instError) throw instError;

    // Update overdue expenses
    const { data: overdueExpenses, error: expError } = await supabase
      .from("expenses")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today)
      .is("deleted_at", null)
      .select("id");

    if (expError) throw expError;

    const result = {
      ok: true,
      overdue_installments: overdueInstallments?.length || 0,
      overdue_expenses: overdueExpenses?.length || 0,
      processed_at: new Date().toISOString(),
    };

    console.log("Cron overdue result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cron overdue error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
