import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { adminGetPricing, adminListOrders, adminSavePricing, adminSetQuote, adminSetStatus, checkAdmin, getOrder } from "@/lib/orders.functions";
import { formatARS, formatNumero, STATUS_LABEL, type OrderStatus } from "@/lib/orders.shared";

const adminQ = queryOptions({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });

export const Route = createFileRoute("/_authenticated/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQ),
  head: () => ({
    meta: [
      { title: "Panel NPG — Pedidos" },
      { name: "description", content: "Panel privado de NPG para gestionar pedidos, presupuestos y pagos." },
      { property: "og:title", content: "Panel NPG" },
      { property: "og:description", content: "Gestión privada de pedidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data } = useSuspenseQuery(adminQ);
  const [sel, setSel] = useState<string | null>(null);
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5 py-10">
        {!data.isAdmin ? <p className="rounded-2xl border border-destructive/50 bg-card p-6">No tenés permisos para ver este panel.</p> : (
          <>
            <h1 className="text-3xl">Panel NPG</h1>
            <Pricing />
            <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
              <Orders sel={sel} onSel={setSel} />
              {sel ? <Detail id={sel} /> : <p className="text-muted-foreground">Elegí un pedido para revisarlo.</p>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Orders({ sel, onSel }: { sel: string | null; onSel: (id: string) => void }) {
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders() });
  if (isLoading) return <p>Cargando…</p>;
  return (
    <ul className="grid h-fit gap-2">
      {data.length === 0 && <li className="text-muted-foreground">Todavía no hay pedidos.</li>}
      {data.map((o) => (
        <li key={o.id}>
          <button onClick={() => onSel(o.id)} className={`w-full rounded-xl border p-3 text-left text-sm ${sel === o.id ? "border-neon bg-accent" : "border-border bg-card hover:border-neon"}`}>
            <span className="flex justify-between"><span className="font-display text-xs">{formatNumero(o.numero)}</span><span className="text-neon">{STATUS_LABEL[o.status as OrderStatus]}</span></span>
            <span className="mt-1 block text-muted-foreground">{(o.contacto as { nombre: string }).nombre} · {o.total_ars != null ? formatARS(o.total_ars) : "sin presupuesto"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Detail({ id }: { id: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder({ data: { id } }) });
  const qc = useQueryClient();
  const setQuote = useServerFn(adminSetQuote);
  const setStatus = useServerFn(adminSetStatus);
  const [total, setTotal] = useState(""); const [dep, setDep] = useState(""); const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  if (isLoading || !data) return <p>Cargando…</p>;
  const o = data.order; const cfg = o.config as Record<string, string | number>; const c = o.contacto as Record<string, string>;
  const refresh = () => { qc.invalidateQueries({ queryKey: ["order", id] }); qc.invalidateQueries({ queryKey: ["admin-orders"] }); };
  const run = async (fn: () => Promise<unknown>) => { setMsg(null); try { await fn(); refresh(); setMsg("Guardado"); } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); } };
  const input = "rounded-xl border border-input bg-muted/60 px-3 py-2";
  return (
    <section className="grid gap-5 rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl">{o.numeroFmt}</h2><span className="text-neon">{STATUS_LABEL[o.status]}</span></div>
      {data.previewUrl && <img src={data.previewUrl} alt="Diseño" className="w-full rounded-2xl border border-border" />}
      {data.logoUrl && <img src={data.logoUrl} alt="Logo" className="h-16 w-16 rounded bg-secondary object-contain p-1" />}
      <p className="text-sm">{String(cfg["tipo"])} · {String(cfg["ancho"])} × {String(cfg["alto"])} m · {String(cfg["iluminacion"])} · Colores: {String(cfg["colores"] || "logo")} · Notas: {String(cfg["notas"] || "—")}</p>
      <p className="text-sm">Cliente: {c["nombre"]} · {c["telefono"]} · {c["email"]} {c["ciudad"] ?? ""}</p>
      <p className="text-sm">Presupuesto: {o.total_ars != null ? formatARS(o.total_ars) : "—"} {o.deposit_ars ? `(seña ${formatARS(o.deposit_ars)})` : ""} · Pagado verificado: {formatARS(data.paid)}</p>

      <form className="grid gap-2 rounded-2xl border border-border p-4" onSubmit={(e) => { e.preventDefault(); run(() => setQuote({ data: { id, total: Number(total), deposit: dep ? Number(dep) : null, note } })); }}>
        <p className="font-semibold">Confirmar / actualizar presupuesto</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input required type="number" min="1" step="0.01" placeholder="Total ARS" value={total} onChange={(e) => setTotal(e.target.value)} className={input} />
          <input type="number" min="1" step="0.01" placeholder="Seña ARS (opcional)" value={dep} onChange={(e) => setDep(e.target.value)} className={input} />
        </div>
        <input placeholder="Nota para el cliente (incluye, plazos, etc.)" value={note} onChange={(e) => setNote(e.target.value)} className={input} />
        <button className="justify-self-start rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground">Aprobar presupuesto y habilitar pago</button>
      </form>

      <div className="flex flex-wrap gap-3">
        <button disabled={o.status !== "pago_aprobado"} onClick={() => run(() => setStatus({ data: { id, status: "en_fabricacion" } }))} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">Pasar a fabricación</button>
        <button disabled={o.status !== "en_fabricacion"} onClick={() => run(() => setStatus({ data: { id, status: "finalizado" } }))} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">Marcar finalizado</button>
        <Link to="/pedidos/$id" params={{ id }} className="px-2 py-2 text-sm text-neon underline">Ver como cliente</Link>
      </div>
      {msg && <p className="text-sm">{msg}</p>}

      <div><p className="font-semibold">Pagos (verificados con Mercado Pago)</p>
        <ul className="mt-2 grid gap-1 text-sm">{data.payments.length === 0 && <li className="text-muted-foreground">Sin pagos.</li>}
          {data.payments.map((p) => <li key={p.id}>{new Date(p.created_at).toLocaleString("es-AR")} · {p.kind} · {formatARS(p.amount_ars)} · <b>{p.status}</b>{p.mp_payment_id ? ` · MP #${p.mp_payment_id}` : ""}</li>)}
        </ul></div>
      <div><p className="font-semibold">Historial</p>
        <ul className="mt-2 grid gap-1 text-sm">{data.events.map((e) => <li key={e.id}>{new Date(e.created_at).toLocaleString("es-AR")} · {e.message}</li>)}</ul></div>
    </section>
  );
}

function Pricing() {
  const { data } = useQuery({ queryKey: ["pricing"], queryFn: () => adminGetPricing() });
  const save = useServerFn(adminSavePricing);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!data) return null;
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4">
      <button onClick={() => setOpen(!open)} className="text-sm font-semibold">Precios: {data.auto_enabled ? "presupuesto automático activo" : "presupuesto manual (NPG confirma cada pedido)"} ▾</button>
      {open && (
        <form className="mt-3 grid gap-2 sm:grid-cols-4" onSubmit={async (e) => {
          e.preventDefault(); const f = new FormData(e.currentTarget); const n = (k: string) => (f.get(k) ? Number(f.get(k)) : null);
          try { await save({ data: { auto_enabled: f.get("auto") === "on", price_per_m2_ars: n("m2"), installation_ars: n("inst"), deposit_percent: n("dep") } }); setMsg("Guardado"); }
          catch (er) { setMsg(er instanceof Error ? er.message : "Error"); }
        }}>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="auto" defaultChecked={data.auto_enabled} /> Automático</label>
          <input name="m2" type="number" step="0.01" min="1" placeholder="Precio por m² (ARS)" defaultValue={data.price_per_m2_ars ?? ""} className="rounded-xl border border-input bg-muted/60 px-3 py-2" />
          <input name="inst" type="number" step="0.01" min="0" placeholder="Instalación (ARS)" defaultValue={data.installation_ars ?? ""} className="rounded-xl border border-input bg-muted/60 px-3 py-2" />
          <input name="dep" type="number" min="1" max="99" placeholder="Seña % (opcional)" defaultValue={data.deposit_percent ?? ""} className="rounded-xl border border-input bg-muted/60 px-3 py-2" />
          <button className="rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-4 sm:justify-self-start">Guardar precios</button>
          {msg && <p className="text-sm sm:col-span-4">{msg}</p>}
        </form>
      )}
    </div>
  );
}
