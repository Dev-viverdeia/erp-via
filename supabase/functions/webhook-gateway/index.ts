import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token, x-webhook-secret, x-hotmart-hottok",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function resolveField(payload: Record<string, any>, path: string): any {
  if (!path) return undefined;
  return path.split(".").reduce((obj, key) => {
    if (obj == null || typeof obj !== "object") return undefined;
    return obj[key];
  }, payload as any);
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Extract slug from URL path: /webhook-gateway/{slug}
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const slug = pathParts[pathParts.length - 1];

  if (!slug || slug === "webhook-gateway") {
    return new Response(JSON.stringify({ error: "Gateway slug required. Use /webhook-gateway/{slug}" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, any>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1. Look up gateway config by slug
  const { data: config, error: configError } = await supabase
    .from("gateway_configs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (configError || !config) {
    return new Response(JSON.stringify({ error: `Gateway '${slug}' not found or inactive` }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Validate webhook secret
  const secretHeader = config.webhook_secret_header || "x-webhook-token";
  const receivedSecret = req.headers.get(secretHeader);
  if (!config.webhook_secret || receivedSecret !== config.webhook_secret) {
    return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Log raw payload
  const { data: logEntry } = await supabase
    .from("webhook_logs")
    .insert({
      source: slug,
      payload,
      company_id: config.company_id,
      gateway_config_id: config.id,
    })
    .select("id")
    .single();

  const logId = logEntry?.id;

  try {
    // 4. Extract fields using field_mapping
    const fieldMapping = (config.field_mapping || {}) as Record<string, string>;
    const eventMapping = (config.event_mapping || {}) as Record<string, string>;

    const extracted = {
      customer_name: resolveField(payload, fieldMapping.customer_name) as string | undefined,
      customer_email: resolveField(payload, fieldMapping.customer_email) as string | undefined,
      customer_document: resolveField(payload, fieldMapping.customer_document) as string | undefined,
      amount: Number(resolveField(payload, fieldMapping.amount)) || 0,
      payment_method: (resolveField(payload, fieldMapping.payment_method) as string) || "pix",
      installments_count: Number(resolveField(payload, fieldMapping.installments_count)) || 1,
      transaction_id: resolveField(payload, fieldMapping.transaction_id) as string | undefined,
      gateway_ref: resolveField(payload, fieldMapping.gateway_ref) as string | undefined,
      raw_event: resolveField(payload, fieldMapping.event_type) as string | undefined,
      paid_at: resolveField(payload, fieldMapping.paid_at) as string | undefined,
      installment_number: Number(resolveField(payload, fieldMapping.installment_number)) || 1,
    };

    // 5. Normalize event type
    const internalEvent = extracted.raw_event ? (eventMapping[extracted.raw_event] || extracted.raw_event) : "payment_confirmed";

    // Update webhook log with event type
    if (logId) {
      await supabase.from("webhook_logs").update({ event_type: internalEvent }).eq("id", logId);
    }

    // 6. Idempotency check
    if (extracted.transaction_id) {
      const { data: existing } = await supabase
        .from("revenue_installments")
        .select("id")
        .eq("gateway_transaction_id", extracted.transaction_id)
        .maybeSingle();

      if (existing) {
        if (logId) {
          await supabase.from("webhook_logs").update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: "Duplicate transaction_id - already processed",
          }).eq("id", logId);
        }
        return new Response(JSON.stringify({ status: "already_processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 7. Process by event type
    switch (internalEvent) {
      case "payment_confirmed":
        await handlePaymentConfirmed(supabase, config, extracted);
        break;
      case "payment_cancelled":
        await handlePaymentCancelled(supabase, config, extracted);
        break;
      case "refund":
        await handleRefund(supabase, config, extracted);
        break;
      case "chargeback":
        await handleChargeback(supabase, config, extracted);
        break;
      case "subscription_cancelled":
        await handleSubscriptionCancelled(supabase, config, extracted);
        break;
      default:
        // Unknown event - just log it
        break;
    }

    // 8. Mark as processed
    if (logId) {
      await supabase.from("webhook_logs").update({
        processed: true,
        processed_at: new Date().toISOString(),
      }).eq("id", logId);
    }

    return new Response(JSON.stringify({ status: "processed", event: internalEvent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    // Log error
    if (logId) {
      await supabase.from("webhook_logs").update({
        error_message: err.message || String(err),
      }).eq("id", logId);
    }
    return new Response(JSON.stringify({ error: err.message || "Processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ===== Helper: Find sale by gateway_ref =====

async function findSaleByGatewayRef(supabase: any, config: any, gateway_ref: string) {
  const { data } = await supabase
    .from("sales")
    .select("id")
    .eq("gateway_ref", gateway_ref)
    .eq("company_id", config.company_id)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

// ===== Event Handlers =====

async function handlePaymentConfirmed(supabase: any, config: any, extracted: any) {
  const { gateway_ref, transaction_id, amount, payment_method, installments_count, paid_at, installment_number } = extracted;

  if (!gateway_ref) throw new Error("gateway_ref is required for payment_confirmed");

  // Check if revenue already exists for this gateway_ref
  const { data: existingRevenue } = await supabase
    .from("revenues")
    .select("id, installments_count")
    .eq("gateway", config.slug)
    .eq("gateway_ref", gateway_ref)
    .is("deleted_at", null)
    .maybeSingle();

  const paidDate = paid_at ? new Date(paid_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  const now = new Date();

  if (existingRevenue) {
    // Revenue exists - sale should also exist already. Just update the installment.
    const existingSale = await findSaleByGatewayRef(supabase, config, gateway_ref);

    const { data: installment } = await supabase
      .from("revenue_installments")
      .select("id")
      .eq("revenue_id", existingRevenue.id)
      .eq("installment_number", installment_number)
      .in("status", ["provisioned", "pending"])
      .maybeSingle();

    if (installment) {
      await supabase.from("revenue_installments").update({
        status: "paid",
        paid_date: paidDate,
        paid_amount: amount / (installments_count || 1),
        gateway_transaction_id: transaction_id,
        bank_account_id: config.default_bank_account_id,
      }).eq("id", installment.id);
    }

    // If all installments are now paid, update sale status to completed
    if (existingSale) {
      const { data: unpaid } = await supabase
        .from("revenue_installments")
        .select("id")
        .eq("revenue_id", existingRevenue.id)
        .in("status", ["provisioned", "pending"])
        .limit(1);

      if (!unpaid || unpaid.length === 0) {
        await supabase.from("sales").update({ status: "completed" }).eq("id", existingSale.id);
        await supabase.from("revenues").update({ status: "completed" }).eq("id", existingRevenue.id);
      }
    }
  } else {
    // ---- New payment flow: Create Sale FIRST, then link revenue and expenses ----

    // Step 1: Upsert partner (customer)
    let partnerId: string | null = null;
    if (extracted.customer_name) {
      const partnerData: any = {
        company_id: config.company_id,
        name: extracted.customer_name,
        type: "customer",
      };
      if (extracted.customer_email) partnerData.email = extracted.customer_email;
      if (extracted.customer_document) partnerData.document = extracted.customer_document;

      if (extracted.customer_document) {
        const { data: existingPartner } = await supabase
          .from("partners")
          .select("id")
          .eq("company_id", config.company_id)
          .eq("document", extracted.customer_document)
          .is("deleted_at", null)
          .maybeSingle();

        if (existingPartner) {
          partnerId = existingPartner.id;
        } else {
          const { data: newPartner } = await supabase
            .from("partners")
            .insert(partnerData)
            .select("id")
            .single();
          partnerId = newPartner?.id || null;
        }
      } else {
        const { data: newPartner } = await supabase
          .from("partners")
          .insert(partnerData)
          .select("id")
          .single();
        partnerId = newPartner?.id || null;
      }
    }

    // Step 2: Look up receivable rules (needed to determine installment count for sale)
    const { data: rules } = await supabase
      .from("gateway_receivable_rules")
      .select("*")
      .eq("gateway_config_id", config.id)
      .or(`payment_method.eq.${payment_method},payment_method.eq.*`)
      .order("payment_method", { ascending: false })
      .limit(1);

    const rule = rules?.[0];
    const ruleType = rule?.rule_type || "single";

    // Build installments based on rule
    type InstallmentDef = { number: number; amount: number; dueDate: string; isPaid: boolean };
    const installments: InstallmentDef[] = [];

    if (ruleType === "single") {
      installments.push({
        number: 1,
        amount: amount,
        dueDate: paidDate,
        isPaid: true,
      });
    } else if (ruleType === "recurring_monthly") {
      const months = rule?.recurring_months || 12;
      const perMonth = amount / months;
      for (let i = 0; i < months; i++) {
        installments.push({
          number: i + 1,
          amount: perMonth,
          dueDate: addDays(now, i * 30),
          isPaid: i === 0,
        });
      }
    } else if (ruleType === "custom") {
      const splits = (rule?.splits || []) as Array<{ percentage: number; days_offset: number }>;
      splits.forEach((split, idx) => {
        installments.push({
          number: idx + 1,
          amount: (amount * split.percentage) / 100,
          dueDate: addDays(now, split.days_offset),
          isPaid: split.days_offset === 0,
        });
      });
    }

    // Normalize payment_method to accepted values
    const normalizedPaymentType = ["pix", "card", "recurring", "boleto", "bank_transfer"].includes(payment_method) ? payment_method : "pix";

    const saleStatus = installments.length === 1 ? "completed" : "active";

    // Step 3: Calculate fee amount (needed for net_amount on the sale)
    const feeAmount = await calculateFeeAmount(supabase, config, amount, payment_method, installments_count);

    // Step 4: Create Sale record
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        company_id: config.company_id,
        partner_id: partnerId,
        product_name: extracted.customer_name ? `Venda - ${extracted.customer_name}` : `Venda via ${config.name}`,
        sale_date: new Date().toISOString(),
        total_amount: amount,
        net_amount: amount - feeAmount,
        payment_method: normalizedPaymentType,
        installments_count: installments.length,
        gateway_config_id: config.id,
        gateway_ref: gateway_ref,
        gateway_transaction_id: transaction_id,
        status: saleStatus,
      })
      .select("id")
      .single();

    if (saleError) throw saleError;

    // Step 5: Create Revenue linked to Sale
    const { data: revenue, error: revError } = await supabase
      .from("revenues")
      .insert({
        company_id: config.company_id,
        partner_id: partnerId,
        total_amount: amount,
        payment_type: normalizedPaymentType,
        installments_count: installments.length,
        gateway: config.slug,
        gateway_ref: gateway_ref,
        status: saleStatus,
        contracted_at: new Date().toISOString(),
        sale_id: sale.id,
      })
      .select("id")
      .single();

    if (revError) throw revError;

    // Step 6: Create Revenue Installments
    const installmentRows = installments.map((inst) => ({
      revenue_id: revenue.id,
      installment_number: inst.number,
      amount: inst.amount,
      due_date: inst.dueDate,
      status: inst.isPaid ? "paid" : "provisioned",
      paid_date: inst.isPaid ? paidDate : null,
      paid_amount: inst.isPaid ? inst.amount : null,
      gateway_transaction_id: inst.isPaid ? transaction_id : null,
      bank_account_id: inst.isPaid ? config.default_bank_account_id : null,
    }));

    await supabase.from("revenue_installments").insert(installmentRows);

    // Step 7: Create Fee Expense linked to Sale
    if (feeAmount > 0) {
      await supabase.from("expenses").insert({
        company_id: config.company_id,
        description: `Taxa ${config.name} - ${payment_method} ${installments_count}x`,
        amount: feeAmount,
        due_date: paidDate,
        status: "pending",
        partner_id: config.vendor_partner_id,
        category_id: config.default_expense_category_id,
        cost_center_id: config.default_cost_center_id,
        sale_id: sale.id,
      });
    }
  }
}

async function handlePaymentCancelled(supabase: any, config: any, extracted: any) {
  const { gateway_ref } = extracted;
  if (!gateway_ref) return;

  const { data: revenue } = await supabase
    .from("revenues")
    .select("id")
    .eq("gateway", config.slug)
    .eq("gateway_ref", gateway_ref)
    .is("deleted_at", null)
    .maybeSingle();

  if (revenue) {
    await supabase
      .from("revenue_installments")
      .update({ status: "cancelled" })
      .eq("revenue_id", revenue.id)
      .in("status", ["provisioned", "pending"]);
  }

  // Update sale status to cancelled
  const existingSale = await findSaleByGatewayRef(supabase, config, gateway_ref);
  if (existingSale) {
    await supabase.from("sales").update({ status: "cancelled" }).eq("id", existingSale.id);
  }
}

async function handleRefund(supabase: any, config: any, extracted: any) {
  const { gateway_ref, amount, transaction_id } = extracted;
  if (!gateway_ref) return;

  const { data: revenue } = await supabase
    .from("revenues")
    .select("id")
    .eq("gateway", config.slug)
    .eq("gateway_ref", gateway_ref)
    .is("deleted_at", null)
    .maybeSingle();

  if (revenue) {
    // Find and cancel the paid installment
    await supabase
      .from("revenue_installments")
      .update({ status: "cancelled" })
      .eq("revenue_id", revenue.id)
      .eq("gateway_transaction_id", transaction_id);
  }

  // Look up sale to link the refund expense and update status
  const existingSale = await findSaleByGatewayRef(supabase, config, gateway_ref);

  // Create refund expense linked to sale
  await supabase.from("expenses").insert({
    company_id: config.company_id,
    description: `Reembolso - ${config.name} (${gateway_ref})`,
    amount: amount || 0,
    due_date: new Date().toISOString().split("T")[0],
    status: "pending",
    partner_id: config.vendor_partner_id,
    category_id: config.default_expense_category_id,
    cost_center_id: config.default_cost_center_id,
    sale_id: existingSale?.id || null,
  });

  // Update sale status to refunded
  if (existingSale) {
    await supabase.from("sales").update({ status: "refunded" }).eq("id", existingSale.id);
  }
}

async function handleChargeback(supabase: any, config: any, extracted: any) {
  const { gateway_ref, amount, transaction_id } = extracted;
  if (!gateway_ref) return;

  const { data: revenue } = await supabase
    .from("revenues")
    .select("id")
    .eq("gateway", config.slug)
    .eq("gateway_ref", gateway_ref)
    .is("deleted_at", null)
    .maybeSingle();

  if (revenue) {
    await supabase
      .from("revenue_installments")
      .update({ status: "cancelled" })
      .eq("revenue_id", revenue.id)
      .eq("gateway_transaction_id", transaction_id);
  }

  // Look up sale to link the chargeback expense and update status
  const existingSale = await findSaleByGatewayRef(supabase, config, gateway_ref);

  // Create chargeback expense linked to sale
  await supabase.from("expenses").insert({
    company_id: config.company_id,
    description: `Chargeback - ${config.name} (${gateway_ref})`,
    amount: amount || 0,
    due_date: new Date().toISOString().split("T")[0],
    status: "pending",
    partner_id: config.vendor_partner_id,
    category_id: config.default_expense_category_id,
    cost_center_id: config.default_cost_center_id,
    sale_id: existingSale?.id || null,
  });

  // Update sale status to refunded (chargeback is a forced refund)
  if (existingSale) {
    await supabase.from("sales").update({ status: "refunded" }).eq("id", existingSale.id);
  }
}

async function handleSubscriptionCancelled(supabase: any, config: any, extracted: any) {
  const { gateway_ref } = extracted;
  if (!gateway_ref) return;

  const { data: revenue } = await supabase
    .from("revenues")
    .select("id")
    .eq("gateway", config.slug)
    .eq("gateway_ref", gateway_ref)
    .is("deleted_at", null)
    .maybeSingle();

  if (revenue) {
    await supabase
      .from("revenue_installments")
      .update({ status: "cancelled" })
      .eq("revenue_id", revenue.id)
      .in("status", ["provisioned", "pending"]);

    await supabase
      .from("revenues")
      .update({ status: "cancelled" })
      .eq("id", revenue.id);
  }

  // Update sale status to cancelled
  const existingSale = await findSaleByGatewayRef(supabase, config, gateway_ref);
  if (existingSale) {
    await supabase.from("sales").update({ status: "cancelled" }).eq("id", existingSale.id);
  }
}

// ===== Fee Calculation =====

async function calculateFeeAmount(supabase: any, config: any, amount: number, paymentMethod: string, installments: number): Promise<number> {
  const { data: rules } = await supabase
    .from("gateway_fee_rules")
    .select("*")
    .eq("gateway_config_id", config.id)
    .or(`payment_method.eq.${paymentMethod},payment_method.eq.*`)
    .lte("installments_min", installments)
    .gte("installments_max", installments)
    .order("payment_method", { ascending: false })
    .limit(1);

  const rule = rules?.[0];
  if (!rule) return 0;

  const feeAmount = (amount * (rule.fee_percentage || 0)) / 100 + (rule.fixed_fee || 0);
  return feeAmount > 0 ? feeAmount : 0;
}
