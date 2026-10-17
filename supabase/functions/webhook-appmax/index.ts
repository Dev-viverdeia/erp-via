import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate token
  const token = req.headers.get("x-webhook-token");
  const expectedToken = Deno.env.get("APPMAX_WEBHOOK_TOKEN");
  if (!expectedToken || token !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Save raw payload
  const { data: logEntry, error: logError } = await supabase
    .from("webhook_logs")
    .insert({
      source: "appmax",
      event_type: payload.event || "unknown",
      payload,
    })
    .select("id")
    .single();

  if (logError) {
    console.error("Failed to save webhook log:", logError);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const logId = logEntry.id;

  try {
    const { event, gateway_ref, transaction_id, installment_number, amount, paid_at } = payload;

    if (!event || !gateway_ref || !transaction_id) {
      throw new Error("Missing required fields: event, gateway_ref, transaction_id");
    }

    // Idempotency: check if this transaction_id was already processed
    const { data: existingInstallment } = await supabase
      .from("revenue_installments")
      .select("id, status")
      .eq("gateway_transaction_id", transaction_id)
      .maybeSingle();

    if (existingInstallment) {
      await supabase.from("webhook_logs").update({ processed: true, processed_at: new Date().toISOString() }).eq("id", logId);
      return new Response(JSON.stringify({ ok: true, message: "Already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the revenue by gateway_ref
    const { data: revenue } = await supabase
      .from("revenues")
      .select("id, company_id")
      .eq("gateway_ref", gateway_ref)
      .is("deleted_at", null)
      .maybeSingle();

    if (!revenue) {
      throw new Error(`Revenue not found for gateway_ref: ${gateway_ref}`);
    }

    await supabase.from("webhook_logs").update({ company_id: revenue.company_id }).eq("id", logId);

    // Find the installment
    const { data: installment } = await supabase
      .from("revenue_installments")
      .select("id, status")
      .eq("revenue_id", revenue.id)
      .eq("installment_number", installment_number || 1)
      .maybeSingle();

    if (!installment) {
      throw new Error(`Installment not found: revenue=${revenue.id}, number=${installment_number}`);
    }

    if (event === "payment.confirmed") {
      await supabase.from("revenue_installments").update({
        status: "paid",
        paid_date: paid_at ? paid_at.split("T")[0] : new Date().toISOString().split("T")[0],
        paid_amount: amount || null,
        gateway_transaction_id: transaction_id,
      }).eq("id", installment.id);
    } else if (event === "payment.failed") {
      await supabase.from("revenue_installments").update({
        status: "overdue",
        gateway_transaction_id: transaction_id,
      }).eq("id", installment.id);
    } else if (event === "payment.cancelled") {
      // Cancel this and all future installments
      await supabase.from("revenue_installments").update({
        status: "cancelled",
        gateway_transaction_id: transaction_id,
      }).eq("id", installment.id);

      // Cancel future installments
      await supabase.from("revenue_installments").update({
        status: "cancelled",
      })
        .eq("revenue_id", revenue.id)
        .gt("installment_number", installment_number || 1)
        .eq("status", "provisioned");
    }

    await supabase.from("webhook_logs").update({
      processed: true,
      processed_at: new Date().toISOString(),
    }).eq("id", logId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    await supabase.from("webhook_logs").update({
      error_message: err.message || String(err),
    }).eq("id", logId);

    return new Response(JSON.stringify({ error: err.message || "Processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
