// Pure order/payment rules shared by browser and server. No secrets here.
export type OrderStatus =
  | "borrador" | "esperando_presupuesto" | "presupuesto_confirmado" | "pendiente_pago"
  | "pago_en_proceso" | "pago_aprobado" | "pago_rechazado" | "pago_cancelado"
  | "en_fabricacion" | "finalizado";

export type PaymentKind = "total" | "sena" | "saldo";

export type OrderConfig = {
  tipo: string;
  ancho: number;
  alto: number;
  colores: string;
  iluminacion: string;
  notas: string;
  nombreComercial?: string;
  catalogo?: "corporeo-led";
  retiro?: "taller-area-51";
  solicitudId?: string;
  montaje?: { corners: {x: number; y: number}[]; widthM: number; heightM: number; measured: boolean; center: {x: number; y: number}; method: "planar_homography" };
};

export type Contacto = { nombre: string; email: string; telefono: string; ciudad?: string };

export const STATUS_LABEL: Record<OrderStatus, string> = {
  borrador: "Borrador",
  esperando_presupuesto: "Esperando presupuesto",
  presupuesto_confirmado: "Presupuesto confirmado",
  pendiente_pago: "Pendiente de pago",
  pago_en_proceso: "Pago en proceso",
  pago_aprobado: "Pago aprobado",
  pago_rechazado: "Pago rechazado",
  pago_cancelado: "Pago cancelado",
  en_fabricacion: "En fabricación",
  finalizado: "Finalizado",
};

export const STATUS_MESSAGE: Record<OrderStatus, string> = {
  borrador: "Tu pedido todavía no fue enviado.",
  esperando_presupuesto: "Recibimos tu pedido. NPG está revisando el diseño para confirmarte el presupuesto.",
  presupuesto_confirmado: "Tu presupuesto está confirmado. Ya podés continuar al pago.",
  pendiente_pago: "Iniciaste el pago. Si no lo terminaste, podés volver a intentarlo.",
  pago_en_proceso: "Mercado Pago está procesando tu pago. Te avisamos apenas se acredite.",
  pago_aprobado: "¡Pago verificado! Ya estamos preparando tu cartel.",
  pago_rechazado: "El pago fue rechazado. Podés intentarlo de nuevo con otro medio.",
  pago_cancelado: "El pago fue cancelado. Podés intentarlo de nuevo cuando quieras.",
  en_fabricacion: "Tu cartel está en fabricación.",
  finalizado: "Tu pedido está finalizado. ¡Gracias por elegir NPG!",
};

export const formatNumero = (n: number) => `NPG-${String(n).padStart(6, "0")}`;
export const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);

export const SIGN_CATALOG = [
  { width: 2, height: 0.5, price: 520000 },
  { width: 3, height: 0.6, price: 720000 },
  { width: 4, height: 0.8, price: 850000 },
  { width: 5, height: 1, price: 970000 },
] as const;
export const WORKSHOP_MAP_URL = "https://maps.app.goo.gl/CEHPtrPkt9BuEcRaA";
export function catalogQuote(config: Pick<OrderConfig, "catalogo" | "tipo" | "ancho" | "alto" | "retiro">) {
  if (config.catalogo !== "corporeo-led") return null;
  const item = SIGN_CATALOG.find((p) => p.width === config.ancho);
  if (!item || config.tipo !== "Corpóreo LED" || config.alto !== item.height || config.retiro !== "taller-area-51") throw new Error("La medida o el retiro del catálogo no son válidos");
  return { total: item.price, deposit: null };
}

/** Statuses where the client may still change the design (no money taken yet). */
export const EDITABLE_STATUSES: OrderStatus[] = [
  "borrador", "esperando_presupuesto", "presupuesto_confirmado", "pendiente_pago", "pago_rechazado", "pago_cancelado",
];

/** Statuses from which the client can start a payment. */
export const PAYABLE_STATUSES: OrderStatus[] = [
  "presupuesto_confirmado", "pendiente_pago", "pago_rechazado", "pago_cancelado", "pago_aprobado",
];

export type PricingSettings = {
  auto_enabled: boolean;
  price_per_m2_ars: number | null;
  installation_ars: number | null;
  deposit_percent: number | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Automatic quote: only when NPG enabled it and set a real m² price. Otherwise null (manual mode). */
export function calcAutoQuote(cfg: Pick<OrderConfig, "ancho" | "alto">, s: PricingSettings | null) {
  if (!s || !s.auto_enabled || !s.price_per_m2_ars || s.price_per_m2_ars <= 0) return null;
  const total = round2(cfg.ancho * cfg.alto * Number(s.price_per_m2_ars) + Number(s.installation_ars ?? 0));
  const deposit = s.deposit_percent ? round2((total * s.deposit_percent) / 100) : null;
  return { total, deposit };
}

export type PaymentOption = { kind: PaymentKind; amount: number; label: string; pendiente: number };

/** Payment options for an order given what is already paid (approved) for the current quote. */
export function paymentOptions(total: number | null, deposit: number | null, paid: number): PaymentOption[] {
  if (total == null || total <= 0) return [];
  const remaining = round2(total - paid);
  if (remaining <= 0) return [];
  if (paid > 0) return [{ kind: "saldo", amount: remaining, label: "Pagar saldo pendiente", pendiente: 0 }];
  const opts: PaymentOption[] = [{ kind: "total", amount: total, label: "Pago total", pendiente: 0 }];
  if (deposit != null && deposit > 0 && deposit < total) {
    opts.push({ kind: "sena", amount: deposit, label: "Seña / anticipo", pendiente: round2(total - deposit) });
  }
  return opts;
}

/** Order status derived from the verified payments of the current quote. */
export function deriveOrderStatus(
  current: OrderStatus,
  payments: { status: string; created_at: string }[],
): OrderStatus {
  if (current === "en_fabricacion" || current === "finalizado") return current;
  if (payments.some((p) => p.status === "approved")) return "pago_aprobado";
  if (payments.some((p) => ["in_process", "pending", "authorized", "in_mediation"].includes(p.status))) return "pago_en_proceso";
  const latest = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (latest?.status === "rejected") return "pago_rechazado";
  if (latest?.status === "cancelled" || latest?.status === "refunded" || latest?.status === "charged_back") return "pago_cancelado";
  return current;
}
