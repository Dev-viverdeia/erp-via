import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
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

  // Validate webhook secret
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = Deno.env.get("CRM_WEBHOOK_SECRET");
  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Save raw payload BEFORE processing
  const { data: logEntry, error: logError } = await supabase
    .from("webhook_logs")
    .insert({
      source: "crm",
      event_type: "new_sale",
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
    const { sale_id, customer, total_amount, payment_type, installments, gateway, gateway_ref } = payload;

    if (!sale_id || !customer || !total_amount || !payment_type) {
      throw new Error("Missing required fields: sale_id, customer, total_amount, payment_type");
    }

    // The configured integration owns this endpoint; never guess the first company.
    const { data: configs, error: configError } = await supabase
      .from("integration_configs")
      .select("company_id")
      .eq("provider", "crm")
      .eq("is_active", true)
      .limit(2);
    if (configError || !configs || configs.length !== 1 || !configs[0].company_id) {
      throw new Error("Configure exactly one company for this CRM webhook");
    }
    const companyId = configs[0].company_id;

    // Idempotency: check if revenue with this sale_id already exists
    const { data: existingRevenue } = await supabase
      .from("revenues")
      .select("id")
      .eq("company_id", companyId)
      .eq("sale_id", sale_id)
      .maybeSingle();

    if (existingRevenue) {
      // Mark log as processed (duplicate)
      await supabase.from("webhook_logs").update({ processed: true, processed_at: new Date().toISOString() }).eq("id", logId);
      return new Response(JSON.stringify({ ok: true, message: "Already processed", revenue_id: existingRevenue.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update log with company_id
    await supabase.from("webhook_logs").update({ company_id: companyId }).eq("id", logId);

    // Upsert partner by document
    let partnerId: string | null = null;
    if (customer.document) {
      const { data: existingPartner } = await supabase
        .from("partners")
        .select("id")
        .eq("company_id", companyId)
        .eq("document", customer.document)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingPartner) {
        partnerId = existingPartner.id;
        // Update partner info
        await supabase.from("partners").update({
          name: customer.name || undefined,
          email: customer.email || undefined,
        }).eq("id", partnerId);
      } else {
        const { data: newPartner } = await supabase
          .from("partners")
          .insert({
            company_id: companyId,
            name: customer.name || "Cliente sem nome",
            document: customer.document,
            email: customer.email || null,
            type: "customer",
          })
          .select("id")
          .single();
        partnerId = newPartner?.id || null;
      }
    }

    // Create revenue
    const installmentsCount = payment_type === "recurring" ? (installments || 12) : 1;
    const { data: revenue, error: revError } = await supabase
      .from("revenues")
      .insert({
        company_id: companyId,
        partner_id: partnerId,
        sale_id,
        payment_type,
        total_amount,
        installments_count: installmentsCount,
        status: "active",
        gateway: gateway || null,
        gateway_ref: gateway_ref || null,
        contracted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (revError) throw revError;

    // Create installments
    const installmentAmount = Number((total_amount / installmentsCount).toFixed(2));
    const installmentRows = [];
    const now = new Date();

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      installmentRows.push({
        revenue_id: revenue.id,
        installment_number: i,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split("T")[0],
        status: i === 1 ? "paid" : "provisioned",
        paid_date: i === 1 ? now.toISOString().split("T")[0] : null,
        paid_amount: i === 1 ? installmentAmount : null,
      });
    }

    const { error: instError } = await supabase.from("revenue_installments").insert(installmentRows);
    if (instError) throw instError;

    // Mark webhook as processed
    await supabase.from("webhook_logs").update({
      processed: true,
      processed_at: new Date().toISOString(),
    }).eq("id", logId);

    return new Response(JSON.stringify({ ok: true, revenue_id: revenue.id }), {
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
