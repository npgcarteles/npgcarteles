import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { InstallationNotice, WorkshopPickup } from "@/components/store-catalog";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CheckoutHeader, CheckoutWhatsApp, OrderCheckout } from "@/components/order-checkout";
import { Button } from "@/components/ui/button";
import { getOrder, startPayment, syncPayment, updateOrderDesign } from "@/lib/orders.functions";
import { formatARS, STATUS_LABEL, STATUS_MESSAGE, type OrderConfig, type PaymentKind } from "@/lib/orders.shared";

const ANCHOS = [2, 3, 4, 5];
const ALTO: Record<number, number> = { 2: 0.5, 3: 0.6, 4: 0.8, 5: 1 };

const orderQuery = (id: string) => queryOptions({ queryKey: ["order", id], queryFn: () => getOrder({ data: { id } }), refetchInterval: 15000 });

export const Route = createFileRoute("/_authenticated/pedidos/$id")({
  validateSearch: (s: Record<string, unknown>): { payment_id?: string | undefined } => ({
    payment_id: typeof s["payment_id"] === "string" || typeof s["payment_id"] === "number" ? String(s["payment_id"]) : undefined,
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(orderQuery(params.id)),
  head: () => ({
    meta: [
      { title: "Tu pedido — NPG Studio" },
      { name: "description", content: "Resumen, presupuesto y pago de tu cartel NPG." },
      { property: "og:title", content: "Tu pedido — NPG Studio" },
      { property: "og:description", content: "Resumen, presupuesto y pago de tu cartel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PedidoDetalle,
});

function stepFor(status: string) {
  if (["pago_aprobado", "en_fabricacion", "finalizado"].includes(status)) return 3;
  if (["presupuesto_confirmado", "pendiente_pago", "pago_en_proceso", "pago_rechazado", "pago_cancelado"].includes(status)) return 2;
  return 1;
}

function PedidoDetalle() {
  const { id } = Route.useParams();
  const { payment_id } = Route.useSearch();
  const { data } = useSuspenseQuery(orderQuery(id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const sync = useServerFn(syncPayment);
  const pay = useServerFn(startPayment);
  const [verifying, setVerifying] = useState(!!payment_id);
  const [kind, setKind] = useState<PaymentKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const did = useRef(false);

  useEffect(() => {
    if (!payment_id || did.current) return;
    did.current = true;
    sync({ data: { id, paymentId: payment_id } })
      .then((result) => { if (!result.ok) setErr("Mercado Pago todavía no confirmó este pago. No se marcó como pagado."); })
      .catch(() => setErr("No pudimos verificar el pago con Mercado Pago. No se marcó como pagado; revisá el estado más tarde."))
      .finally(async () => {
        await qc.invalidateQueries({ queryKey: ["order", id] });
        setVerifying(false);
        navigate({ to: "/pedidos/$id", params: { id }, search: {}, replace: true });
      });
  }, [payment_id, id, sync, qc, navigate]);

  const { order, options } = data;
  const selected = options.find((o) => o.kind === kind) ?? options[0];
  const cfg = order.config as OrderConfig;
  const c = order.contacto as { nombre: string; email: string; telefono: string; ciudad?: string };
  const confirmed = ["pago_aprobado", "en_fabricacion", "finalizado"].includes(order.status);

  async function pagar() {
    if (!selected) return;
    setBusy(true); setErr(null);
    try {
      const r = await pay({ data: { id, kind: selected.kind } });
      window.location.href = r.url;
    } catch (e) { setErr(e instanceof Error ? e.message : "No se pudo iniciar el pago"); setBusy(false); }
  }

  return (
    <main className="checkout-theme min-h-screen pb-24">
      <CheckoutHeader />
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="order-2 border-border px-6 py-8 lg:border-r">
          {verifying && <p role="status" className="mb-6 flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Verificando tu pago con Mercado Pago…</p>}
          {confirmed && <div className="mb-6 flex items-start gap-3 border-b border-border pb-6"><CheckCircle2 className="size-6 shrink-0" /><div><p className="font-bold">Pedido {order.numeroFmt} confirmado</p><p className="mt-1 text-sm text-muted-foreground">{STATUS_MESSAGE[order.status]}</p></div></div>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold">Pedido {order.numeroFmt}</h1>
            <span className="text-xs text-muted-foreground">{STATUS_LABEL[order.status]}</span>
          </div>
          {!confirmed && cfg.catalogo && <p className="mt-5 flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 shrink-0" /> Solicitud registrada correctamente</p>}
          {!confirmed && <p className="mt-3 text-sm leading-6 text-muted-foreground">{cfg.catalogo && order.status === "esperando_presupuesto" ? "NPG está revisando disponibilidad y detalles de fabricación. Tu precio de catálogo está registrado; el pago se habilita después de esa confirmación." : STATUS_MESSAGE[order.status]}</p>}
          {data.previewUrl && <img src={data.previewUrl} alt="Simulación del cartel" className="mt-6 w-full" />}
          {data.previewUrl && <p className="mt-3 text-xs leading-5 text-muted-foreground">Aviso importante: Este contenido visual corresponde a una simulación gráfica optimizada. Ha sido generado exclusivamente como una muestra de referencia estética, por lo que no constituye una oferta contractual ni una réplica exacta del entregable final.</p>}
          {data.previewUrl && <p className="mt-3 text-xs text-muted-foreground">{cfg.montaje?.measured ? "Escala calibrada con medidas declaradas por el cliente; no es una medición profesional." : "Vista ilustrativa: escala real no verificada"}</p>}
          {!data.previewUrl && <p className="mt-4 text-sm text-muted-foreground">No hay un montaje vigente para estas medidas. Prepará una nueva simulación en el configurador.</p>}
          {data.logoUrl && <div className="mt-4 flex items-center gap-3"><img src={data.logoUrl} alt="Logo del cliente" className="h-14 w-14 bg-secondary object-contain p-1" /><span className="text-sm text-muted-foreground">Logo del cliente</span></div>}
          {editing ? <EditDesign id={id} cfg={cfg} onDone={() => setEditing(false)} /> : (
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <Item k="Tipo de cartel" v={cfg.tipo} />
              <Item k="Dimensiones" v={`${cfg.ancho} m × ${cfg.alto} m`} />
              <Item k="Iluminación" v={cfg.iluminacion} />
              {cfg.nombreComercial && <Item k="Negocio" v={cfg.nombreComercial} />}
              <Item k="Contacto" v={`${c.nombre} · ${c.telefono} · ${c.email}${c.ciudad ? ` · ${c.ciudad}` : ""}`} />
            </dl>
          )}
          {cfg.catalogo && <><InstallationNotice /><WorkshopPickup /></>}
          {data.editable && data.isOwner && !editing && <Button variant="link" onClick={() => setEditing(true)} className="mt-4 h-auto whitespace-normal px-0 text-left">Editar diseño (requiere nueva revisión del precio)</Button>}
          {data.events.length > 0 && <div className="mt-8 border-t border-border pt-6"><h2 className="text-base font-bold">Historial</h2><ul className="mt-3 grid gap-3 text-sm">{data.events.map((e) => <li key={e.id} className="flex flex-wrap gap-x-3 gap-y-1"><span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("es-AR")}</span><span>{e.message}</span></li>)}</ul></div>}
        </div>
        <div className="order-1 lg:order-2">
          <OrderCheckout total={order.total_ars} paid={data.paid} options={options} selected={selected} isOwner={data.isOwner} busy={busy} error={err} quoteNote={order.quote_note} onKind={setKind} onPay={pagar} />
        </div>
      </div>
      <CheckoutWhatsApp />
    </main>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return <div className="border-b border-border pb-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 break-words font-semibold">{v}</dd></div>;
}

function EditDesign({ id, cfg, onDone }: { id: string; cfg: OrderConfig; onDone: () => void }) {
  const [v, setV] = useState(cfg);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(updateOrderDesign);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm ${on ? "border-primary bg-accent" : "border-border"}`;
  return (
    <div className="mt-5 grid gap-4 border border-border p-4">
      <div className="flex flex-wrap gap-2">{ANCHOS.map((a) => <Button variant="outline" key={a} type="button" onClick={() => setV({ ...v, ancho: a, alto: ALTO[a] ?? 0.6 })} className={chip(v.ancho === a)}>{a} m × {ALTO[a]} m</Button>)}</div>
      <input value={v.colores} maxLength={200} onChange={(e) => setV({ ...v, colores: e.target.value })} placeholder="Colores" className="rounded-xl border border-input bg-muted/60 px-4 py-3" />
      <input value={v.notas} maxLength={500} onChange={(e) => setV({ ...v, notas: e.target.value })} placeholder="Observaciones" className="rounded-xl border border-input bg-muted/60 px-4 py-3" />
      <div className="flex gap-3">
        <Button disabled={busy} onClick={async () => { setBusy(true); setError(null); try { await save({ data: { id, config: v } }); await qc.invalidateQueries({ queryKey: ["order", id] }); onDone(); } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron guardar los cambios."); } finally { setBusy(false); } }}
          className="rounded-none shadow-none">Guardar cambios</Button>
        <Button disabled={busy} variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
