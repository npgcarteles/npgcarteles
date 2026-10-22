import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { InstallationNotice, WorkshopPickup } from "@/components/store-catalog";
import { Button } from "@/components/ui/button";
import { catalogQuote, formatARS } from "@/lib/orders.shared";
import { saveDraft } from "@/lib/draft-store";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CheckoutSteps, SiteHeader } from "@/components/site-header";
import { clearDraft, loadDraft, type Draft } from "@/lib/draft-store";
import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/pedido/nuevo")({
  head: () => ({
    meta: [
      { title: "Confirmá tu pedido — NPG Studio" },
      { name: "description", content: "Revisá tu diseño y completá tus datos para enviar el pedido a NPG." },
      { property: "og:title", content: "Confirmá tu pedido — NPG Studio" },
      { property: "og:description", content: "Resumen del cartel y datos de contacto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NuevoPedido,
});

function NuevoPedido() {
  const [draft, setDraft] = useState<Draft | null | undefined>(undefined);
  const [c, setC] = useState({ nombre: "", email: "", telefono: "", ciudad: "" });
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [err, setErr] = useState<string | null>(null);
  const create = useServerFn(createOrder);
  const navigate = useNavigate();

  useEffect(() => {
    loadDraft().then((d) => setDraft(d ?? null)).catch(() => setDraft(null));
    supabase.auth.getUser().then(({ data }) => { const email = data.user?.email; if (email) setC((x) => ({ ...x, email: x.email || email })); });
  }, []);
  const previewUrl = useMemo(() => (draft ? URL.createObjectURL(draft.preview) : null), [draft]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const price = draft ? catalogQuote(draft.config)?.total : null;

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || submitting.current) return;
    submitting.current = true;
    setBusy(true); setErr(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Iniciá sesión para confirmar tu pedido");
      const uid = u.user.id;
      const requestId = draft.requestId ?? crypto.randomUUID();
      if (!draft.requestId) { await saveDraft({ ...draft, requestId }); setDraft({ ...draft, requestId }); }
      const key = crypto.randomUUID();
      const pPath = `${uid}/${key}/preview.png`;
      const up1 = await supabase.storage.from("order-images").upload(pPath, draft.preview, { contentType: draft.preview.type || "image/png" });
      if (up1.error) throw new Error("No se pudo subir la simulación");
      let lPath: string | null = null;
      if (draft.logo) {
        lPath = `${uid}/${key}/logo`;
        const up2 = await supabase.storage.from("order-images").upload(lPath, draft.logo, { contentType: draft.logo.type || "image/png" });
        if (up2.error) throw new Error("No se pudo subir el logo. Probá de nuevo.");
      }
      const r = await create({ data: { config: { ...draft.config, solicitudId: requestId }, contacto: { ...c, ciudad: c.ciudad || undefined }, previewPath: pPath, logoPath: lPath } });
      await clearDraft().catch(() => undefined);
      navigate({ to: "/pedidos/$id", params: { id: r.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo crear el pedido");
      setBusy(false);
      submitting.current = false;
    }
  }

  const f = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });
  const input = "rounded-xl border border-input bg-muted/60 px-4 py-3 outline-none focus:border-neon";

  return (
    <main className="min-h-screen pb-16">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <CheckoutSteps current={1} />
        {draft === undefined ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-neon" /> : !draft ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <p className="font-display">No encontramos un diseño para confirmar.</p>
            <Link to="/" hash="crear" className="mt-4 inline-block text-neon underline">Volver al configurador</Link>
          </div>
        ) : (
          <form onSubmit={confirmar} className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="rounded-3xl border border-border bg-card p-6">
              <h1 className="text-2xl">Resumen de tu proyecto</h1>
              {previewUrl && <img src={previewUrl} alt="Simulación del cartel" className="mt-5 w-full rounded-2xl border border-border" />}
              {previewUrl && <p className="mt-3 text-xs leading-5 text-muted-foreground">Aviso importante: Este contenido visual corresponde a una simulación gráfica optimizada. Ha sido generado exclusivamente como una muestra de referencia estética, por lo que no constituye una oferta contractual ni una réplica exacta del entregable final.</p>}
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <Item k="Tipo de cartel" v={draft.config.tipo} />
                <Item k="Dimensiones" v={`${draft.config.ancho} m × ${draft.config.alto} m`} />
                <Item k="Colores" v={draft.config.colores || "Los del logo"} />
                <Item k="Iluminación" v={draft.config.iluminacion} />
                <Item k="Observaciones" v={draft.config.notas || "—"} />
              </dl>
              {price != null && <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-border pt-5"><span>Precio del cartel · ARS</span><strong className="text-2xl">{formatARS(price)}</strong></div>}
              {draft.config.nombreComercial && <p className="mt-4">Negocio: {draft.config.nombreComercial}</p>}
              {draft.config.catalogo && <><InstallationNotice /><WorkshopPickup /></>}
              <Link to="/" hash="crear" className="mt-5 inline-block text-sm text-neon underline">Volver a editar el diseño</Link>
            </section>
            <aside className="grid h-fit gap-4 rounded-3xl border border-neon/40 bg-card p-6 shadow-glow lg:sticky lg:top-24">
              <h2 className="text-lg">Tus datos de contacto</h2>
              <input required minLength={2} maxLength={100} placeholder="Nombre y apellido" value={c.nombre} onChange={f("nombre")} className={input} />
              <input required type="email" maxLength={255} placeholder="Email" value={c.email} onChange={f("email")} className={input} />
              <input required minLength={6} maxLength={30} placeholder="Teléfono / WhatsApp" value={c.telefono} onChange={f("telefono")} className={input} />
              <input maxLength={100} placeholder="Ciudad (opcional)" value={c.ciudad} onChange={f("ciudad")} className={input} />
              <p className="text-xs text-muted-foreground">NPG confirma disponibilidad y detalles de fabricación. Tu solicitud no está pagada; el pago se habilita después de esa confirmación.</p>
              {draft.config.catalogo && <><label className="flex items-start gap-2 text-sm"><input type="radio" required defaultChecked name="retiro" className="mt-1" /> Retiro gratuito en Taller Área 51</label><InstallationNotice /><label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1" /> Entiendo que el precio no incluye instalación.</label></>}
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1" /> Revisé la simulación, el tipo de cartel, las medidas y la iluminación.</label>
              <Button type="submit" disabled={busy} className="flex h-auto items-center justify-center gap-2 rounded-md bg-gradient-brand py-4 font-display text-xs text-primary-foreground shadow-none disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} CONFIRMAR SOLICITUD
              </Button>
              {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return <div className="rounded-xl bg-secondary/50 p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>;
}
