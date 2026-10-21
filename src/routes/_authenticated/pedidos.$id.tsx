import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { CheckoutSteps, SiteHeader } from "@/components/site-header";
import { getOrder, startPayment, syncPayment, updateOrderDesign } from "@/lib/orders.functions";
import { formatARS, STATUS_LABEL, STATUS_MESSAGE, type OrderConfig, type PaymentKind } from "@/lib/orders.shared";

const ANCHOS = [2, 2.5, 3, 3.5, 4, 4.5, 5];
const ALTOS = [0.3, 0.4, 0.5, 0.6, 0.8, 1];

const orderQuery = (id: string) => queryOptions({ queryKey: ["order", id], queryFn: () => getOrder({ data: { id } }) });

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
      .catch(() => null)
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

  const payBox = (
    <>
      {order.total_ars == null ? (
        <p className="text-sm text-muted-foreground">NPG está preparando tu presupuesto. Te avisamos cuando esté listo para pagar.</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between"><span className="text-sm text-muted-foreground">Presupuesto confirmado</span><span className="font-display text-2xl">{formatARS(order.total_ars)}</span></div>
          {data.paid > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pagado</span><span className="text-success">{formatARS(data.paid)}</span></div>}
          {data.paid > 0 && order.total_ars - data.paid > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Saldo pendiente</span><span>{formatARS(order.total_ars - data.paid)}</span></div>}
          {order.quote_note && <p className="rounded-xl bg-secondary/50 p-3 text-sm">{order.quote_note}</p>}
        </>
      )}
      {options.length > 0 && data.isOwner && (
        <div className="grid gap-2">
          <p className="text-sm font-semibold">Modalidad de pago</p>
          {options.map((o) => (
            <button key={o.kind} type="button" onClick={() => setKind(o.kind)}
              className={`rounded-xl border p-3 text-left text-sm transition ${selected?.kind === o.kind ? "border-neon bg-accent" : "border-border hover:border-neon"}`}>
              <span className="flex justify-between font-semibold"><span>{o.label}</span><span>{formatARS(o.amount)}</span></span>
              <span className="mt-1 block text-xs text-muted-foreground">Pagás ahora {formatARS(o.amount)}{o.pendiente > 0 ? ` · Saldo pendiente ${formatARS(o.pendiente)}` : " · Sin saldo pendiente"}</span>
            </button>
          ))}
          <button onClick={pagar} disabled={busy} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-brand py-4 font-display text-sm text-primary-foreground shadow-glow disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} CONTINUAR AL PAGO
          </button>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-neon" /> Pagás en el entorno seguro de Mercado Pago. NPG no guarda datos de tarjetas.</p>
        </div>
      )}
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
    </>
  );

  return (
    <main className="min-h-screen pb-40 lg:pb-16">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <CheckoutSteps current={stepFor(order.status)} />
        {verifying && <p className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-neon/40 bg-card p-4"><Loader2 className="h-4 w-4 animate-spin" /> Verificando tu pago con Mercado Pago…</p>}
        {confirmed && (
          <div className="mb-6 rounded-3xl border border-success/50 bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <p className="mt-2 font-display text-lg">Pedido {order.numeroFmt} confirmado</p>
            <p className="text-sm text-muted-foreground">{STATUS_MESSAGE[order.status]}</p>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl">Pedido {order.numeroFmt}</h1>
              <span className="rounded-full border border-neon/50 px-3 py-1 text-xs font-semibold text-neon">{STATUS_LABEL[order.status]}</span>
            </div>
            {!confirmed && <p className="mt-2 text-sm text-muted-foreground">{STATUS_MESSAGE[order.status]}</p>}
            {data.previewUrl && <img src={data.previewUrl} alt="Simulación del cartel" className="mt-5 w-full rounded-2xl border border-border" />}
            {data.logoUrl && <div className="mt-4 flex items-center gap-3"><img src={data.logoUrl} alt="Logo del cliente" className="h-14 w-14 rounded-lg bg-secondary object-contain p-1" /><span className="text-sm text-muted-foreground">Logo del cliente</span></div>}
            {editing ? <EditDesign id={id} cfg={cfg} onDone={() => setEditing(false)} /> : (
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <Item k="Tipo de cartel" v={cfg.tipo} />
                <Item k="Dimensiones" v={`${cfg.ancho} m × ${cfg.alto} m`} />
                <Item k="Colores" v={cfg.colores || "Los del logo"} />
                <Item k="Iluminación" v={cfg.iluminacion} />
                <Item k="Observaciones" v={cfg.notas || "—"} />
                <Item k="Contacto" v={`${c.nombre} · ${c.telefono} · ${c.email}${c.ciudad ? ` · ${c.ciudad}` : ""}`} />
              </dl>
            )}
            {data.editable && data.isOwner && !editing && (
              <button onClick={() => setEditing(true)} className="mt-4 text-sm text-neon underline">Editar diseño (requiere nueva revisión del precio)</button>
            )}
            {data.events.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold">Historial</p>
                <ul className="mt-2 grid gap-2 text-sm">
                  {data.events.map((e) => <li key={e.id} className="flex gap-3"><span className="shrink-0 text-muted-foreground">{new Date(e.created_at).toLocaleString("es-AR")}</span><span>{e.message}</span></li>)}
                </ul>
              </div>
            )}
          </section>
          <aside className="hidden h-fit gap-4 rounded-3xl border border-neon/40 bg-card p-6 shadow-glow lg:sticky lg:top-24 lg:grid">{payBox}</aside>
        </div>
      </div>
      <div className="glass fixed inset-x-0 bottom-0 z-40 grid max-h-[70vh] gap-3 overflow-y-auto border-t border-border p-4 lg:hidden">{payBox}</div>
    </main>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return <div className="rounded-xl bg-secondary/50 p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>;
}

function EditDesign({ id, cfg, onDone }: { id: string; cfg: OrderConfig; onDone: () => void }) {
  const [v, setV] = useState(cfg);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(updateOrderDesign);
  const qc = useQueryClient();
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm ${on ? "border-neon bg-accent" : "border-border"}`;
  return (
    <div className="mt-5 grid gap-4 rounded-2xl border border-border p-4">
      <div className="flex flex-wrap gap-2">{ANCHOS.map((a) => <button key={a} type="button" onClick={() => setV({ ...v, ancho: a })} className={chip(v.ancho === a)}>{a} m ancho</button>)}</div>
      <div className="flex flex-wrap gap-2">{ALTOS.map((a) => <button key={a} type="button" onClick={() => setV({ ...v, alto: a })} className={chip(v.alto === a)}>{a} m alto</button>)}</div>
      <input value={v.colores} maxLength={200} onChange={(e) => setV({ ...v, colores: e.target.value })} placeholder="Colores" className="rounded-xl border border-input bg-muted/60 px-4 py-3" />
      <input value={v.notas} maxLength={500} onChange={(e) => setV({ ...v, notas: e.target.value })} placeholder="Observaciones" className="rounded-xl border border-input bg-muted/60 px-4 py-3" />
      <div className="flex gap-3">
        <button disabled={busy} onClick={async () => { setBusy(true); await save({ data: { id, config: v } }); await qc.invalidateQueries({ queryKey: ["order", id] }); onDone(); }}
          className="rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground">Guardar cambios</button>
        <button onClick={onDone} className="text-sm text-muted-foreground">Cancelar</button>
      </div>
    </div>
  );
}
