export type GatewayInternalEvent =
  | "payment_confirmed"
  | "payment_cancelled"
  | "refund"
  | "chargeback"
  | "subscription_cancelled";

export const GATEWAY_INTERNAL_EVENTS: { value: GatewayInternalEvent; label: string }[] = [
  { value: "payment_confirmed", label: "Pagamento Confirmado" },
  { value: "payment_cancelled", label: "Pagamento Cancelado" },
  { value: "refund", label: "Reembolso" },
  { value: "chargeback", label: "Chargeback" },
  { value: "subscription_cancelled", label: "Assinatura Cancelada" },
];

export const MAPPABLE_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "customer_name", label: "Nome do Cliente", required: true },
  { key: "customer_email", label: "Email do Cliente", required: false },
  { key: "customer_document", label: "Documento (CPF/CNPJ)", required: false },
  { key: "amount", label: "Valor Total", required: true },
  { key: "payment_method", label: "Metodo de Pagamento", required: true },
  { key: "installments_count", label: "Numero de Parcelas", required: false },
  { key: "transaction_id", label: "ID da Transacao", required: true },
  { key: "gateway_ref", label: "Referencia do Gateway", required: true },
  { key: "event_type", label: "Tipo do Evento", required: true },
  { key: "paid_at", label: "Data do Pagamento", required: false },
  { key: "installment_number", label: "Numero da Parcela", required: false },
];

export type GatewayFieldMapping = Record<string, string>;
export type GatewayEventMapping = Record<string, GatewayInternalEvent>;

export type ReceivableSplit = {
  percentage: number;
  days_offset: number;
};

export type GatewayTemplate = {
  name: string;
  slug: string;
  webhookSecretHeader: string;
  fieldMapping: GatewayFieldMapping;
  eventMapping: GatewayEventMapping;
};

export const GATEWAY_TEMPLATES: GatewayTemplate[] = [
  {
    name: "Hubla",
    slug: "hubla",
    webhookSecretHeader: "x-webhook-token",
    fieldMapping: {
      customer_name: "customer.name",
      customer_email: "customer.email",
      customer_document: "customer.doc",
      amount: "payment.total",
      payment_method: "payment.method",
      installments_count: "payment.installments",
      transaction_id: "transaction.id",
      gateway_ref: "subscription_id",
      event_type: "type",
      paid_at: "payment.paid_at",
    },
    eventMapping: {
      "payment.confirmed": "payment_confirmed",
      "payment.failed": "payment_cancelled",
      "payment.refunded": "refund",
      "subscription.cancelled": "subscription_cancelled",
    },
  },
  {
    name: "Hotmart",
    slug: "hotmart",
    webhookSecretHeader: "x-hotmart-hottok",
    fieldMapping: {
      customer_name: "data.buyer.name",
      customer_email: "data.buyer.email",
      customer_document: "data.buyer.document",
      amount: "data.purchase.price.value",
      payment_method: "data.purchase.payment.type",
      installments_count: "data.purchase.payment.installments_number",
      transaction_id: "data.purchase.transaction",
      gateway_ref: "data.purchase.order_bump.id",
      event_type: "event",
      paid_at: "data.purchase.approved_date",
    },
    eventMapping: {
      PURCHASE_COMPLETE: "payment_confirmed",
      PURCHASE_CANCELED: "payment_cancelled",
      PURCHASE_REFUNDED: "refund",
      PURCHASE_CHARGEBACK: "chargeback",
    },
  },
  {
    name: "AppMax",
    slug: "appmax",
    webhookSecretHeader: "x-webhook-token",
    fieldMapping: {
      customer_name: "customer.name",
      customer_email: "customer.email",
      customer_document: "customer.cpf",
      amount: "payment.total",
      payment_method: "payment.method",
      installments_count: "payment.installments",
      transaction_id: "transaction_id",
      gateway_ref: "gateway_ref",
      event_type: "event",
      paid_at: "payment.paid_at",
    },
    eventMapping: {
      "payment.confirmed": "payment_confirmed",
      "payment.failed": "payment_cancelled",
      "payment.cancelled": "payment_cancelled",
      "payment.refunded": "refund",
      "payment.chargeback": "chargeback",
    },
  },
  {
    name: "GoBank",
    slug: "gobank",
    webhookSecretHeader: "x-webhook-secret",
    fieldMapping: {
      customer_name: "cliente.nome",
      customer_email: "cliente.email",
      customer_document: "cliente.documento",
      amount: "pagamento.valor",
      payment_method: "pagamento.metodo",
      installments_count: "pagamento.parcelas",
      transaction_id: "pagamento.id_transacao",
      gateway_ref: "pagamento.referencia",
      event_type: "evento",
      paid_at: "pagamento.data",
    },
    eventMapping: {
      payment_approved: "payment_confirmed",
      payment_cancelled: "payment_cancelled",
      payment_refunded: "refund",
      payment_chargeback: "chargeback",
    },
  },
];

export const WEBHOOK_BASE_URL = "https://plddtqltiankiourbvcy.supabase.co/functions/v1/webhook-gateway";

export function extractJsonPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return [];
  const paths: string[] = [];
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      paths.push(...extractJsonPaths(val, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}
