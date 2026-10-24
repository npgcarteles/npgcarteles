import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CatalogHeading, StoreCatalog, InstallationNotice, WorkshopPickup } from "@/components/store-catalog";
import { SIGN_CATALOG, formatARS } from "@/lib/orders.shared";
import { Input } from "@/components/ui/input";
import { saveDraft } from "@/lib/draft-store";
import { AccountLinks } from "@/components/site-header";
import { useEffect, useRef, useState } from "react";
const MAX_PRUEBAS = 2;
import { Award, Box, Brush, Check, Download, HeartHandshake, ImagePlus, Lightbulb, Loader2, Menu, MessageCircle, Palette, PenTool, Printer, Rocket, Sparkles, Store, Users, X, Layers, Wand2 } from "lucide-react";
import spaceBg from "@/assets/space-bg.jpg";
import alien from "@/assets/alien.png";
import { streamImage } from "@/lib/stream-image";
import { Button } from "@/components/ui/button";
import { buildPrompt, ILUMINACION, TIPOS, PERSONALIZADOS, type SignConfig } from "@/lib/sign-prompt";

const trBocados = "/assets/trabajo-bocados.png";
const trAroma = "/assets/trabajo-panaderia-aroma.png";
const trChipa = "/assets/trabajo-senor-chipa.png";
const trQueso = "/assets/trabajo-punto-queso.png";
const WHATSAPP = "5492975169780";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carteles lindos al mejor precio — NPG Cartelería" },
      { name: "description", content: "Corpóreos LED de 2 a 5 metros con precios en pesos argentinos, simulación y retiro gratuito en Taller Área 51." },
      { property: "og:title", content: "Carteles lindos al mejor precio — NPG Cartelería" },
      { property: "og:description", content: "Elegí tu medida y personalizá tu Corpóreo LED. Retiro gratuito; instalación por separado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TRABAJOS = [
  { titulo: "Corpóreo LED de polyfan", items: [{ nombre: "Bocado's", img: trBocados }, { nombre: "Panadería Aroma", img: trAroma }] },
  { titulo: "Corpóreo LED de acrílico", items: [{ nombre: "Señor Chipá", img: trChipa }, { nombre: "Punto Queso", img: trQueso }] },
];

const NAV = [
  { id: "inicio", label: "Inicio" },
  { id: "servicios", label: "Servicios" },
  { id: "trabajos", label: "Nuestros trabajos" },
  { id: "crear", label: "Armá tu cartel" },
  { id: "contacto", label: "Contacto" },
];

const SERVICIOS = [
  { icon: Store, label: "Cartelería comercial", desc: "Carteles para frentes de locales, oficinas y comercios. Diseñamos, fabricamos e instalamos la identificación de tu negocio para que se vea desde lejos y transmita tu marca." },
  { icon: Lightbulb, label: "Corpóreos LED", desc: "Letras y logos en volumen (relieve 3D) con iluminación LED interna o trasera. Le dan a tu fachada un aspecto premium de día y una presencia impactante de noche." },
  { icon: Printer, label: "Impresión en vinilo", desc: "Vinilos impresos o de corte para vidrieras, vehículos, paredes y carteles. Una forma versátil y económica de comunicar promociones, horarios o tu identidad." },
  { icon: Layers, label: "Ploteos y rotulaciones", desc: "Ploteo de vidrieras y ventanales con vinilo impreso, de corte o esmerilado, y rotulación de vehículos, paredes y superficies para comunicar tu marca." },
  { icon: Box, label: "Impresión 3D", desc: "Piezas, logos y letras impresas en 3D a medida. Permite formas complejas y detalles que serían difíciles con otros materiales." },
  { icon: PenTool, label: "Diseño de logos", desc: "Creamos o renovamos el logo de tu marca, pensado para que funcione bien en carteles, redes, papelería y cualquier soporte." },
  { icon: Brush, label: "Rediseño de fachadas", desc: "Proponemos una nueva imagen para el frente de tu local: cartelería, colores e iluminación integrados para que tu negocio se destaque en la cuadra." },
];

const POR_QUE = [
  { icon: Award, label: "Calidad y durabilidad" },
  { icon: Palette, label: "Diseños personalizados" },
  { icon: Users, label: "Asesoramiento profesional" },
  { icon: HeartHandshake, label: "Atención cercana" },
  { icon: Rocket, label: "Compromiso en cada proyecto" },
];

function Alien({ className = "" }: { className?: string }) {
  const [hop, setHop] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-[12%] animate-pulse-glow rounded-full bg-gradient-brand blur-3xl" aria-hidden />
      <button
        type="button"
        aria-label="Alien de NPG"
        onClick={() => { setHop(true); setTimeout(() => setHop(false), 500); }}
        className="relative block w-full animate-float"
      >
        <img
          src={alien}
          alt="Alien mascota de NPG con gorra y buzo con el logo"
          width={1024}
          height={1024}
          className={`w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:-rotate-3 hover:scale-105 ${hop ? "-translate-y-6 scale-105" : ""}`}
        />
      </button>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="glass fixed inset-x-0 top-0 z-50 border-b border-border">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-[clamp(1.5rem,9vw,5.5rem)]">
        <a href="#inicio" aria-label="NPG Diseño & Cartelería — Inicio"><img src={"/assets/npg-logo.png"} alt="NPG Diseño & Cartelería" width={189} height={133} className="h-8 w-auto" /></a>
        <ul className="hidden gap-7 text-sm md:flex">
          {NAV.map((n) => (
            <li key={n.id}><a href={`#${n.id}`} className="text-muted-foreground transition hover:text-foreground">{n.label}</a></li>
          ))}
        </ul>
        <AccountLinks className="hidden md:flex" />
        <button className="p-2 md:hidden" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <ul className="grid gap-1 border-t border-border px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <li key={n.id}><a onClick={() => setOpen(false)} href={`#${n.id}`} className="block rounded-lg px-3 py-3 hover:bg-accent">{n.label}</a></li>
          ))}
          <li className="px-3 py-3"><AccountLinks /></li>
        </ul>
      )}
    </nav>
  );
}

function Servicios() {
  const [sel, setSel] = useState<number | null>(1);
  const cur = sel !== null ? SERVICIOS[sel] : null;
  return (
    <>
      <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
        {SERVICIOS.map(({ icon: I, label }, i) => (
          <button key={label} type="button" aria-pressed={sel === i} onClick={() => setSel(sel === i ? null : i)}
            className={`group min-w-[150px] snap-start rounded-2xl border p-5 text-center transition hover:-translate-y-1 hover:border-neon hover:shadow-glow ${sel === i ? "border-neon bg-accent shadow-glow" : "border-border bg-card"}`}>
            <I className="mx-auto h-8 w-8 text-neon transition group-hover:text-primary-glow" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold">{label}</p>
          </button>
        ))}
      </div>
      {cur && (
        <div key={cur.label} className="mt-4 flex animate-rise flex-col gap-4 rounded-2xl border border-neon/50 bg-card p-6 sm:flex-row sm:items-center md:p-8">
          <cur.icon className="h-12 w-12 shrink-0 text-primary-glow" strokeWidth={1.5} />
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl"><span className="text-gradient">{cur.label}</span></h3>
            <p className="mt-2 text-muted-foreground">{cur.desc}</p>
          </div>
          <a href="#crear" className="rounded-full bg-gradient-brand px-6 py-3 text-center font-display text-xs text-primary-foreground shadow-glow">Armá tu cartel</a>
        </div>
      )}
    </>
  );
}

function Upload({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  return (
    <label className="group relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/60 transition hover:border-neon hover:shadow-glow">
      {file ? (
        <>
          <img src={URL.createObjectURL(file)} alt={label} className="h-full w-full object-contain" />
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-semibold text-background"><Check className="h-3 w-3" /> Listo</span>
        </>
      ) : (
        <span className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
          <ImagePlus className="h-8 w-8 text-neon transition group-hover:scale-110" />
          <span className="font-display text-sm text-foreground">{label}</span>
          Tocá para subir
        </span>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-2.5 text-sm transition ${value === o ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow" : "border-border bg-secondary/60 hover:border-neon"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="relative rounded-2xl border border-border bg-card p-5 backdrop-blur md:p-7">
      <h3 className="mb-5 flex items-center gap-3 text-lg md:text-xl">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${done ? "bg-success text-background" : "bg-gradient-brand text-primary-foreground"}`}>
          {done ? <Check className="h-4 w-4" /> : n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function SectionTitle({ kicker, title, sub }: { kicker?: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      {kicker && <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-neon">{kicker}</p>}
      <h2 className="text-3xl md:text-5xl">{title}</h2>
      {sub && <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Index() {
  const revision = useRef(0);
  const [nombreComercial, setNombreComercial] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [cfg, setCfg] = useState<SignConfig>({ tipo: "Corpóreo LED", tamano: "3 m de ancho x 0.6 m de alto", colores: "", iluminacion: ILUMINACION[0] ?? "", notas: "" });
  const [result, setResult] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ancho, setAncho] = useState("3");
  const [alto, setAlto] = useState("0.6");
  const [usadas, setUsadas] = useState(0);
  const [misDisenos, setMisDisenos] = useState<{ id: number; image: string; name: string; width: number; height: number }[]>([]);
  const [paying, setPaying] = useState(false);
  useEffect(() => {
    setUsadas(Number(localStorage.getItem("npg-pruebas") || 0));
    try { setMisDisenos(JSON.parse(localStorage.getItem("Mis diseños") || "[]")); } catch { setMisDisenos([]); }
  }, []);
  const restantes = Math.max(0, MAX_PRUEBAS - usadas);
  useEffect(() => { revision.current += 1; setResult(null); setFinal(false); setError(null); }, [foto, logo, cfg]);
  const setMedida = (a: string, h: string) => { setAncho(a); setAlto(h); setCfg((c) => ({ ...c, tamano: `${a} m de ancho x ${h} m de alto` })); };
  const set = (k: keyof SignConfig) => (v: string) => setCfg((c) => ({ ...c, [k]: v }));

  async function generar() {
    if (restantes <= 0) return setError("Ya usaste tus 2 pruebas con IA. Escribinos por WhatsApp para seguir con tu proyecto.");
    if (!foto || !logo) return setError("Subí la foto del local y el logo.");
    setError(null); setLoading(true); setResult(null); setFinal(false);
    const startedRevision = revision.current;
    try {
      const form = new FormData();
      form.append("image[]", foto);
      form.append("image[]", logo);
      const references = await Promise.all([trBocados, trChipa].map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error("No se pudieron cargar las fotos de referencia de NPG. Probá de nuevo.");
        return response.blob();
      }));
      references.forEach((image, i) => form.append("image[]", image, `trabajo-npg-${i + 1}.png`));
      form.append("prompt", buildPrompt(cfg));
      form.append("size", "auto");
      form.append("quality", "high");
      await streamImage("/api/edit-image", form, (src, isFinal) => {
        if (revision.current !== startedRevision) return;
        setResult(src); setFinal(isFinal);
        if (isFinal) {
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement("canvas");
            const scale = Math.min(1, 640 / image.width);
            canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const item = { id: Date.now(), image: canvas.toDataURL("image/jpeg", 0.7), name: nombreComercial || "Mi cartel", width: Number(ancho), height: Number(alto) };
            try {
              const next = [item, ...JSON.parse(localStorage.getItem("Mis diseños") || "[]")].slice(0, 5);
              localStorage.setItem("Mis diseños", JSON.stringify(next)); setMisDisenos(next);
            } catch { setError("Diseño generado. No se pudo guardar en este navegador por falta de espacio."); }
          };
          image.src = src;
        }
      });
      if (revision.current !== startedRevision) throw new Error("La configuración cambió. Generá un montaje nuevo.");
      const n = usadas + 1;
      localStorage.setItem("npg-pruebas", String(n)); setUsadas(n);
    } catch (e) {
      setResult(null); setFinal(false);
      setError(e instanceof Error ? e.message : "No se pudo generar la simulación.");
    } finally {
      setLoading(false);
    }
  }

  const waText = encodeURIComponent(
    `Hola NPG Studio! Quiero cotizar este proyecto:\n• Tipo: ${cfg.tipo}\n• Tamaño: ${cfg.tamano}\n• Colores: ${cfg.colores || "los del logo"}\n• Iluminación: ${cfg.iluminacion}${cfg.notas ? `\n• Notas: ${cfg.notas}` : ""}\n(Adjunto la simulación descargada)`,
  );
  const waLink = `https://wa.me/${WHATSAPP}?text=${waText}`;
  const waContact = `https://wa.me/${WHATSAPP}`;
  async function pagarConMercadoPago() {
    if (!ready) return;
    setPaying(true); setError(null);
    try {
      const response = await fetch("/api/mercadopago", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ width: Number(ancho), height: Number(alto), businessName: nombreComercial }) });
      const data = await response.json() as { init_point?: string; error?: string };
      if (!response.ok || !data.init_point) throw new Error(data.error || "No se pudo iniciar el pago.");
      window.location.assign(data.init_point);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar el pago."); setPaying(false); }
  }
  useEffect(() => () => { if (result?.startsWith("blob:")) URL.revokeObjectURL(result); }, [result]);
  const ready = !!(result && final);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  async function continuarPedido() {
    if (!result) return;
    setSaving(true);
    try {
      const preview = await (await fetch(result)).blob();
      await saveDraft({ preview, logo, ...(foto ? {originalPhoto: foto} : {}), savedAt: Date.now(), config: { catalogo: "corporeo-led", retiro: "taller-area-51", nombreComercial, tipo: cfg.tipo, ancho: Number(ancho), alto: Number(alto), colores: cfg.colores, iluminacion: cfg.iluminacion, notas: cfg.notas } });
      navigate({ to: "/pedido/nuevo" });
    } catch { setError("No se pudo preparar el pedido. Probá de nuevo."); setSaving(false); }
  }
  const progress = [!!foto && !!logo, true, ready, ready].filter(Boolean).length;

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Nav />

      {/* HERO */}
      <header id="inicio" className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
        <img src={spaceBg} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="starfield absolute inset-0" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-[clamp(1.5rem,9vw,5.5rem)] py-12 md:grid-cols-2 md:gap-12">
          <div className="animate-rise text-center md:text-left">
            <img src={"/assets/npg-logo.png"} alt="NPG Diseño & Cartelería" width={189} height={133} className="mx-auto mb-5 h-20 w-auto drop-shadow-[0_0_24px_rgba(118,43,255,0.6)] md:mx-0 md:h-24" />
            <h1 className="text-[clamp(2.55rem,6vw,4.5rem)] leading-[0.96] tracking-[-0.055em]">
              <span className="block">Hacemos</span>
              <span className="block">que tu</span>
              <span className="block">negocio</span>
              <span className="text-gradient block">impacte</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground md:mx-0">Diseñá y visualizá tu próximo cartel con NPG.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <a href="#crear" className="rounded-full bg-gradient-brand px-8 py-4 text-center font-display text-sm text-primary-foreground shadow-glow transition hover:scale-[1.03]">Empezar a diseñar</a>
              <a href="#servicios" className="rounded-full border border-border px-8 py-4 text-center text-sm font-semibold transition hover:border-neon">Conocé nuestros servicios</a>
            </div>
            <p className="mt-5 text-sm tracking-widest text-muted-foreground">Diseño · Fabricación · Instalación</p>
          </div>
          <Alien className="mx-auto w-[min(72vw,320px)] md:w-full md:max-w-[480px]" />
        </div>
      </header>

      {/* SERVICIOS */}
      <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionTitle kicker="SERVICIOS" title={<>Todo para que tu marca <span className="text-gradient">destaque</span></>} />
        <Servicios />
      </section>

      {/* CONFIGURADOR */}
      <section id="crear" className="relative scroll-mt-16 border-y border-border px-5 py-16">
        <div className="relative mx-auto max-w-6xl">
          <CatalogHeading />
          <div className="mb-8 flex flex-col items-center gap-4 md:flex-row md:items-end md:justify-between">
            <div className="text-center md:text-left">
              <p className="mb-2 text-xs font-semibold tracking-[0.3em] text-neon">ESTUDIO NPG</p>
              <h2 className="text-3xl md:text-5xl">Armá tu propio <span className="text-gradient">cartel</span></h2>
              <p className="mt-2 text-muted-foreground">Diseñá, visualizá y personalizá tu idea.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden w-48 sm:block">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progreso</span><span>{progress}/4</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-brand transition-all duration-500" style={{ width: `${progress * 25}%` }} /></div>
              </div>
              <img src={alien} alt="" width={96} height={96} loading="lazy" className="h-20 w-20 animate-float md:h-24 md:w-24" />
            </div>
          </div>

          <div className="grid gap-5">
            <Step n={1} title="Personalizá tu cartel" done={!!foto && !!logo}>
              <label className="mb-5 grid gap-2 text-sm">Nombre comercial (opcional)<Input value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} maxLength={100} placeholder="Nombre de tu negocio" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Upload label="Foto del local" file={foto} onFile={setFoto} />
                <Upload label="Tu logo" file={logo} onFile={setLogo} />
              </div>
            </Step>

            <Step n={2} title="Configurá el cartel" done={false}>
              <div className="grid gap-6">
                <div>
                  <p className="mb-3 text-sm font-semibold text-muted-foreground">Tipo de cartel</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {TIPOS.map((t) => (
                      <button key={t.id} type="button" onClick={() => set("tipo")(t.id)}
                        className={`rounded-xl border p-4 text-left transition ${cfg.tipo === t.id ? "border-neon bg-accent shadow-glow" : "border-border bg-secondary/50 hover:border-neon"}`}>
                        <span className="block font-display text-sm">{t.id}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4">
                  <p className="text-sm font-semibold text-muted-foreground">Medidas del cartel</p>
                  <div><p className="mb-2 text-sm">Ancho · Precio en ARS</p><StoreCatalog width={Number(ancho)} onSelect={(a, h) => setMedida(String(a), String(h))} /><InstallationNotice /></div>
                </div>
                <div><p className="mb-3 text-sm font-semibold text-muted-foreground">Iluminación</p><Chips options={ILUMINACION} value={cfg.iluminacion} onChange={set("iluminacion")} />
                  <p className="mt-2 text-xs text-muted-foreground">¿Necesitás otro tipo de LED? <a href={waContact} target="_blank" rel="noreferrer" className="text-neon underline">Escribinos por privado</a>.</p></div>
              </div>
            </Step>

            <Step n={3} title="Generá la simulación" done={ready}>
              <Button onClick={generar} disabled={loading || !foto || !logo}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-4 font-display text-sm text-primary-foreground shadow-glow transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generando simulación…</> : <><Wand2 className="h-5 w-5" /> Generar montaje ({restantes} de {MAX_PRUEBAS} pruebas)</>}
              </Button>
              {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">{error}</p>}
              {ready && <p className="mt-4 flex items-center gap-2 text-success"><Sparkles className="h-4 w-4" /> ¡Simulación lista!</p>}
              {result ? (
                <img src={result} alt="Simulación del cartel" className={`mt-6 w-full rounded-2xl border border-border transition-[filter] duration-700 ${final ? "blur-0" : "blur-2xl"}`} />
              ) : null}
              {result && <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button onClick={pagarConMercadoPago} disabled={!ready || paying} className="min-h-14 w-full rounded-xl bg-[#FFD700] px-5 py-4 font-display text-base font-extrabold text-black shadow-[0_8px_24px_rgba(255,215,0,0.22)] hover:bg-[#f2cb00] disabled:opacity-50">
                  {paying ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> ABRIENDO MERCADO PAGO…</> : "PAGAR CON MERCADO PAGO"}
                </Button>
                <a href={waLink} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-center rounded-xl border border-white/20 bg-black px-5 py-4 text-center font-display text-sm font-bold text-white transition hover:border-[#FFD700] hover:text-[#FFD700]">PEDIR POR WHATSAPP</a>
              </div>}
              {misDisenos.length > 0 && <section className="mt-8" aria-label="Mis diseños"><h4 className="mb-3 font-display text-lg">Mis diseños</h4><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{misDisenos.map((design) => <button key={design.id} type="button" onClick={() => { setResult(design.image); setFinal(true); setAncho(String(design.width)); setAlto(String(design.height)); }} className="overflow-hidden rounded-xl border border-border text-left transition hover:border-[#FFD700]"><img src={design.image} alt={design.name} className="aspect-video w-full object-cover"/><span className="block truncate px-3 py-2 text-sm">{design.name}</span></button>)}</div></section>}
              {result && <p className="mt-3 text-sm font-semibold">Medida del pedido: {ancho} m × {alto} m · Vista ilustrativa: escala real no verificada.</p>}
              <p role="note" className="mt-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  <strong className="text-foreground">Aviso importante:</strong> Este contenido visual corresponde a una simulación gráfica optimizada. Ha sido generado exclusivamente como una muestra de referencia estética, por lo que no constituye una oferta contractual ni una réplica exacta del entregable final.
              </p>
              {result ? null : (
                <div className="mt-6 flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-center text-muted-foreground">
                  {loading ? "Preparando tu montaje…" : "Acá vas a ver tu cartel en la fachada"}
                </div>
              )}
            </Step>

            <InstallationNotice />
            <WorkshopPickup />
            <Step n={4} title="Revisá tu compra" done={false}>
              <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Medida elegida</dt><dd className="font-bold">{ancho} metros · {cfg.tipo}</dd></div><div><dt className="text-muted-foreground">Precio del cartel</dt><dd className="text-xl font-bold">{formatARS(SIGN_CATALOG.find((p) => p.width === Number(ancho))?.price ?? 0)}</dd></div><div><dt className="text-muted-foreground">Iluminación</dt><dd>{cfg.iluminacion}</dd></div><div><dt className="text-muted-foreground">Entrega</dt><dd>Retiro gratis en Taller Área 51</dd></div></dl>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={ready && result ? result : undefined} download="npg-studio-simulacion.png" aria-disabled={!ready}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full border border-neon py-3.5 font-semibold text-neon transition hover:bg-accent ${ready ? "" : "pointer-events-none opacity-40"}`}>
                  <Download className="h-4 w-4" /> Descargar PNG
                </a>
                <Button onClick={continuarPedido} disabled={!ready || saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 font-display text-sm text-primary-foreground shadow-glow transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} CONTINUAR COMPRA
                </Button>
              </div>
            </Step>
          </div>
        </div>
      </section>

      {/* TRABAJOS */}
      <section id="trabajos" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionTitle kicker="PORTFOLIO" title="Nuestros trabajos" sub="Ideas que dejan huella." />
        <div className="grid gap-12">
          {TRABAJOS.map((g) => (
            <div key={g.titulo}>
              <div className="mb-5 flex items-center gap-4">
                <h3 className="font-display text-lg md:text-xl"><span className="text-gradient">{g.titulo}</span></h3>
                <span className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {g.items.map((t) => (
                  <figure key={t.nombre} className="group relative overflow-hidden rounded-3xl border border-border bg-card transition duration-500 hover:-translate-y-1 hover:border-neon hover:shadow-glow">
                    <img src={t.img} alt={`Cartel ${g.titulo} de ${t.nombre}`} loading="lazy" width={1200} height={1600} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent p-5 pt-16">
                      <p className="font-display text-base">{t.nombre}</p>
                      <p className="text-xs tracking-widest text-neon">{g.titulo.toUpperCase()}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POR QUÉ */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle title={<>¿Por qué elegir <span className="text-gradient">NPG</span>?</>} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {POR_QUE.map(({ icon: I, label }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-6 text-center transition hover:border-neon">
              <I className="mx-auto h-8 w-8 text-neon" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="relative scroll-mt-16 overflow-hidden px-5 py-24">
        <img src={spaceBg} alt="" width={1920} height={1088} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row">
          <img src={alien} alt="" width={200} height={200} loading="lazy" className="w-36 animate-float md:w-52" />
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-5xl">¿Listo para hacer <span className="text-gradient">despegar</span> tu idea?</h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <a href={waContact} target="_blank" rel="noreferrer" className="rounded-full bg-gradient-brand px-8 py-4 text-center font-display text-sm text-primary-foreground shadow-glow transition hover:scale-[1.03]">Contactanos</a>
              <a href={waLink} target="_blank" rel="noreferrer" className="rounded-full border border-border px-8 py-4 text-center text-sm font-semibold transition hover:border-neon">Solicitar presupuesto</a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">WhatsApp: 297 516-9780</p>
            <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-5 text-left">
              <p className="font-display text-sm">Trabajos personalizados</p>
              <p className="mt-1 text-sm text-muted-foreground">Estas opciones se cotizan a medida. Consultanos por privado:</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {PERSONALIZADOS.map((t) => (
                  <li key={t.id} className="text-sm"><span className="font-semibold">{t.id}</span> <span className="text-muted-foreground">— {t.desc}</span></li>
                ))}
              </ul>
              <a href={waContact} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-neon underline">Consultar por WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">© NPG Diseño & Cartelería</footer>
    </main>
  );
}




