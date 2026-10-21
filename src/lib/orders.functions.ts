import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  calcAutoQuote, EDITABLE_STATUSES, formatNumero, PAYABLE_STATUSES, paymentOptions,
  type OrderStatus, type PricingSettings,
} from "./orders.shared";

const configSchema = z.object({
  tipo: z.literal("Corpóreo LED"),
  ancho: z.number().min(2).max(5),
  alto: z.number().min(0.3).max(1),
  colores: z.string().trim().max(200),
  iluminacion: z.string().trim().min(1).max(80),
  notas: z.string().trim().max(500),
  montaje: z.object({
    corners: z.array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })).length(4),
    widthM: z.number().positive().max(100), heightM: z.number().positive().max(100), measured: z.boolean(),
    center: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
    method: z.literal("planar_homography"),
  }).optional(),
});
const contactoSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  telefono: z.string().trim().min(6).max(30),
  ciudad: z.string().trim().max(100).optional(),
});
const idSchema = z.object({ id: z.string().uuid() });

const now = () => new Date().toISOString();

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function readPricing(): Promise<PricingSettings | null> {
  const db = await admin();
  const { data } = await db.from("pricing_settings").select("*").eq("id", 1).maybeSingle();
  return data ? { ...data, price_per_m2_ars: data.price_per_m2_ars == null ? null : Number(data.price_per_m2_ars), installation_ars: data.installation_ars == null ? null : Number(data.installation_ars) } : null;
}

async function approvedPaid(orderId: string, quoteVersion: number) {
  const db = await admin();
  const { data } = await db.from("payments").select("amount_ars,status").eq("order_id", orderId).eq("quote_version", quoteVersion);
  return (data ?? []).filter((p) => p.status === "approved").reduce((s, p) => s + Number(p.amount_ars), 0);
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("No autorizado");
}

/* ---------------- Cliente ---------------- */

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    config: configSchema, contacto: contactoSchema,
    previewPath: z.string().max(300), logoPath: z.string().max(300).nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const prefix = `${context.userId}/`;
    if (!data.previewPath.startsWith(prefix) || (data.logoPath && !data.logoPath.startsWith(prefix))) throw new Error("Archivo inválido");
    const quote = calcAutoQuote(data.config, await readPricing());
    const db = await admin();
    const status: OrderStatus = quote ? "presupuesto_confirmado" : "esperando_presupuesto";
    const { data: order, error } = await db.from("orders").insert({
      user_id: context.userId, status, config: data.config, contacto: data.contacto,
      preview_path: data.previewPath, logo_path: data.logoPath,
      total_ars: quote?.total ?? null, deposit_ars: quote?.deposit ?? null, quote_version: quote ? 1 : 0,
    }).select("id,numero").single();
    if (error || !order) { console.error(error); throw new Error("No se pudo crear el pedido"); }
    await db.from("order_events").insert({ order_id: order.id, status, message: quote ? "Pedido creado con presupuesto automático" : "Pedido creado; esperando presupuesto de NPG" });
    return { id: order.id, numero: formatNumero(order.numero) };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("orders")
      .select("id,numero,status,config,total_ars,created_at").eq("user_id", context.userId).order("created_at", { ascending: false });
    return (data ?? []).map((o) => ({ ...o, total_ars: o.total_ars == null ? null : Number(o.total_ars) }));
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    // RLS: owner or admin only.
    const { data: o } = await context.supabase.from("orders").select("*").eq("id", data.id).maybeSingle();
    if (!o) throw new Error("Pedido no encontrado");
    const [{ data: pays }, { data: events }] = await Promise.all([
      context.supabase.from("payments").select("id,kind,amount_ars,status,status_detail,mp_payment_id,quote_version,created_at").eq("order_id", o.id).order("created_at", { ascending: false }),
      context.supabase.from("order_events").select("id,status,message,created_at").eq("order_id", o.id).order("created_at", { ascending: false }),
    ]);
    const sign = async (p: string | null) => p ? (await context.supabase.storage.from("order-images").createSignedUrl(p, 3600)).data?.signedUrl ?? null : null;
    const total = o.total_ars == null ? null : Number(o.total_ars);
    const deposit = o.deposit_ars == null ? null : Number(o.deposit_ars);
    const paid = (pays ?? []).filter((p) => p.status === "approved" && p.quote_version === o.quote_version).reduce((s, p) => s + Number(p.amount_ars), 0);
    const status = o.status as OrderStatus;
    return {
      order: { ...o, status, total_ars: total, deposit_ars: deposit, numeroFmt: formatNumero(o.numero) },
      previewUrl: await sign(o.preview_path), logoUrl: await sign(o.logo_path),
      payments: (pays ?? []).map((p) => ({ ...p, amount_ars: Number(p.amount_ars) })),
      events: events ?? [],
      paid,
      options: PAYABLE_STATUSES.includes(status) ? paymentOptions(total, deposit, paid) : [],
      editable: EDITABLE_STATUSES.includes(status) && paid === 0,
      isOwner: o.user_id === context.userId,
    };
  });

export const updateOrderDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), config: configSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: o } = await db.from("orders").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (!o) throw new Error("Pedido no encontrado");
    if (!EDITABLE_STATUSES.includes(o.status as OrderStatus) || (await approvedPaid(o.id, o.quote_version)) > 0) throw new Error("Este pedido ya no se puede editar");
    const quote = calcAutoQuote(data.config, await readPricing());
    const status: OrderStatus = quote ? "presupuesto_confirmado" : "esperando_presupuesto";
    await db.from("orders").update({
      config: data.config, status, total_ars: quote?.total ?? null, deposit_ars: quote?.deposit ?? null,
      preview_path: null,
      quote_version: o.quote_version + 1, updated_at: now(),
    }).eq("id", o.id);
    await db.from("order_events").insert({ order_id: o.id, status, message: "El cliente modificó el diseño; el presupuesto anterior quedó sin efecto" });
    return { ok: true };
  });

export const startPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), kind: z.enum(["total", "sena", "saldo"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: o } = await db.from("orders").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (!o) throw new Error("Pedido no encontrado");
    if (!PAYABLE_STATUSES.includes(o.status as OrderStatus)) throw new Error("Este pedido todavía no tiene un presupuesto confirmado");
    const { data: pays } = await db.from("payments").select("status").eq("order_id", o.id).eq("quote_version", o.quote_version);
    if ((pays ?? []).some((p) => ["in_process", "pending", "authorized"].includes(p.status))) throw new Error("Ya hay un pago en proceso para este pedido. Esperá la confirmación de Mercado Pago.");
    const paid = (pays ?? []).filter((p: any) => p.status === "approved").length ? await approvedPaid(o.id, o.quote_version) : 0;
    // Amount always computed on the server from the confirmed quote.
    const opt = paymentOptions(o.total_ars == null ? null : Number(o.total_ars), o.deposit_ars == null ? null : Number(o.deposit_ars), paid).find((x) => x.kind === data.kind);
    if (!opt) throw new Error("Esa modalidad de pago no está disponible para este pedido");

    const { data: row, error } = await db.from("payments").insert({
      order_id: o.id, kind: opt.kind, amount_ars: opt.amount, quote_version: o.quote_version,
    }).select("id").single();
    if (error || !row) throw new Error("No se pudo iniciar el pago");
    const origin = getRequestHeader("origin") ?? `https://${getRequestHeader("host")}`;
    const kindLabel = { total: "Pago total", sena: "Seña", saldo: "Saldo" }[opt.kind];
    const pref = await createPreferenceSafe({ paymentRowId: row.id, orderId: o.id, title: `NPG ${formatNumero(o.numero)} — ${kindLabel}`, amount: opt.amount, origin });
    await db.from("payments").update({ preference_id: pref.id }).eq("id", row.id);
    if (o.status !== "pago_aprobado") await db.from("orders").update({ status: "pendiente_pago", updated_at: now() }).eq("id", o.id);
    await db.from("order_events").insert({ order_id: o.id, status: o.status === "pago_aprobado" ? "pago_aprobado" : "pendiente_pago", message: `Se inició el pago (${kindLabel})` });
    return { url: pref.url };
  });

async function createPreferenceSafe(p: Parameters<typeof import("./mercadopago.server").createPreference>[0]) {
  const { createPreference } = await import("./mercadopago.server");
  return createPreference(p);
}

/** Called when the client returns from Mercado Pago. Verifies the payment on MP's servers. */
export const syncPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), paymentId: z.string().regex(/^\d{1,20}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { getPayment, applyPayment } = await import("./mercadopago.server");
    const { data: o } = await context.supabase.from("orders").select("id").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (!o) throw new Error("Pedido no encontrado");
    const mp = await getPayment(data.paymentId);
    if (!mp || !mp.external_reference) return { ok: false };
    const db = await admin();
    const { data: row } = await db.from("payments").select("order_id").eq("id", mp.external_reference).maybeSingle();
    if (!row || row.order_id !== o.id) return { ok: false };
    await applyPayment(mp);
    return { ok: true };
  });

/* ---------------- Administración NPG ---------------- */

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("orders").select("id,numero,status,config,contacto,total_ars,created_at").order("created_at", { ascending: false }).limit(500);
    return (data ?? []).map((o) => ({ ...o, total_ars: o.total_ars == null ? null : Number(o.total_ars) }));
  });

export const adminSetQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(), total: z.number().positive().max(1_000_000_000),
    deposit: z.number().positive().nullable(), note: z.string().trim().max(1000),
  }).refine((v) => v.deposit == null || v.deposit < v.total, "La seña debe ser menor al total").parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data: o } = await db.from("orders").select("*").eq("id", data.id).single();
    if (!o) throw new Error("Pedido no encontrado");
    if ((await approvedPaid(o.id, o.quote_version)) > 0) throw new Error("Este pedido ya tiene pagos aprobados; no se puede cambiar el presupuesto");
    await db.from("orders").update({
      total_ars: data.total, deposit_ars: data.deposit, quote_note: data.note || null,
      quote_version: o.quote_version + 1, status: "presupuesto_confirmado", updated_at: now(),
    }).eq("id", o.id);
    await db.from("order_events").insert({ order_id: o.id, status: "presupuesto_confirmado", message: `NPG confirmó el presupuesto: $${data.total}${data.deposit ? ` (seña $${data.deposit})` : ""}` });
    return { ok: true };
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["en_fabricacion", "finalizado"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data: o } = await db.from("orders").select("id,status").eq("id", data.id).single();
    if (!o) throw new Error("Pedido no encontrado");
    const allowed: Record<string, string[]> = { en_fabricacion: ["pago_aprobado"], finalizado: ["en_fabricacion"] };
    if (!allowed[data.status]!.includes(o.status)) throw new Error("Transición de estado no permitida");
    await db.from("orders").update({ status: data.status, updated_at: now() }).eq("id", o.id);
    await db.from("order_events").insert({ order_id: o.id, status: data.status, message: data.status === "en_fabricacion" ? "El cartel pasó a fabricación" : "Pedido finalizado" });
    return { ok: true };
  });

export const adminGetPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => { await assertAdmin(context); return readPricing(); });

export const adminSavePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    auto_enabled: z.boolean(), price_per_m2_ars: z.number().positive().nullable(),
    installation_ars: z.number().min(0).nullable(), deposit_percent: z.number().int().min(1).max(99).nullable(),
  }).refine((v) => !v.auto_enabled || v.price_per_m2_ars != null, "Para activar el modo automático cargá el precio por m²").parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    await db.from("pricing_settings").update({ ...data, updated_at: now() }).eq("id", 1);
    return { ok: true };
  });
