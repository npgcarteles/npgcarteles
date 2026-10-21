// Server-only Mercado Pago helpers (Checkout Pro). Never import from client code.
import { deriveOrderStatus, type OrderStatus } from "./orders.shared";

const API = "https://api.mercadopago.com";

function accessToken() {
  const t = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!t) throw new Error("Los pagos todavía no están configurados. Contactá a NPG.");
  return t;
}

export async function createPreference(p: {
  paymentRowId: string; orderId: string; title: string; amount: number; origin: string;
}) {
  const token = accessToken();
  const secure = p.origin.startsWith("https://");
  const back = `${p.origin}/pedidos/${p.orderId}`;
  const body: Record<string, unknown> = {
    items: [{ id: p.paymentRowId, title: p.title, quantity: 1, unit_price: p.amount, currency_id: "ARS" }],
    external_reference: p.paymentRowId,
    back_urls: { success: back, failure: back, pending: back },
    statement_descriptor: "NPG CARTELERIA",
  };
  if (secure) {
    body["auto_return"] = "approved";
    body["notification_url"] = `${p.origin}/api/public/mercadopago/webhook`;
  }
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": p.paymentRowId },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("MP preference error", res.status, await res.text().catch(() => ""));
    throw new Error("No se pudo iniciar el pago con Mercado Pago. Probá de nuevo en unos minutos.");
  }
  const json = (await res.json()) as { id: string; init_point: string; sandbox_init_point?: string };
  const url = token.startsWith("TEST-") && json.sandbox_init_point ? json.sandbox_init_point : json.init_point;
  return { id: json.id, url };
}

export type MpPayment = {
  id: number; status: string; status_detail: string; external_reference: string | null;
  transaction_amount: number; currency_id: string;
};

export async function getPayment(id: string): Promise<MpPayment | null> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`MP payment lookup failed: ${res.status}`);
  return (await res.json()) as MpPayment;
}

/** Validates Mercado Pago's x-signature header (HMAC-SHA256 of the documented manifest). */
export async function verifyWebhookSignature(req: Request, dataId: string) {
  const secret = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
  if (!secret) return false;
  const sig = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(sig.split(",").map((kv) => kv.trim().split("=") as [string, string]));
  const ts = parts["ts"]; const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

/** Idempotently records a verified MP payment and updates the order status. */
export async function applyPayment(mp: MpPayment) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ref = mp.external_reference;
  if (!ref || !/^[0-9a-f-]{36}$/i.test(ref)) return;
  const { data: row } = await supabaseAdmin.from("payments").select("*").eq("id", ref).maybeSingle();
  if (!row) return;
  if (row.status === "approved" && row.mp_payment_id !== String(mp.id)) return; // keep the approved attempt

  const amountOk = mp.currency_id === "ARS" && Math.abs(Number(mp.transaction_amount) - Number(row.amount_ars)) < 0.01;
  const status = amountOk ? mp.status : "monto_invalido";
  if (row.status === status && row.mp_payment_id === String(mp.id)) return; // already processed

  await supabaseAdmin.from("payments").update({
    status, status_detail: mp.status_detail, mp_payment_id: String(mp.id), updated_at: new Date().toISOString(),
  }).eq("id", row.id);

  const { data: order } = await supabaseAdmin.from("orders").select("id,status,quote_version").eq("id", row.order_id).single();
  if (!order) return;
  const { data: pays } = await supabaseAdmin.from("payments").select("status,created_at")
    .eq("order_id", order.id).eq("quote_version", order.quote_version);
  const next = deriveOrderStatus(order.status as OrderStatus, pays ?? []);
  if (next !== order.status) {
    await supabaseAdmin.from("orders").update({ status: next, updated_at: new Date().toISOString() }).eq("id", order.id);
  }
  await supabaseAdmin.from("order_events").insert({
    order_id: order.id, status: next,
    message: amountOk ? `Mercado Pago informó el pago #${mp.id}: ${mp.status}` : `Pago #${mp.id} con importe que no coincide; no se aprobó`,
  });
}
