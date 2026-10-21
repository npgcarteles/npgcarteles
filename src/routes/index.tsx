import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Box, Brush, Check, Download, HeartHandshake, ImagePlus, Lightbulb, Loader2, Menu, MessageCircle, Palette, PenTool, Printer, Rocket, Sparkles, Store, Users, X, Layers, Wand2 } from "lucide-react";
import spaceBg from "@/assets/space-bg.jpg";
import alien from "@/assets/alien.png";
import npgLogo from "@/assets/npg-logo.png.asset.json";
import { streamImage } from "@/lib/stream-image";
import { buildPrompt, ILUMINACION, TAMANOS, TIPOS, type SignConfig } from "@/lib/sign-prompt";

const WHATSAPP = "5492975169780";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NPG — Armá tu cartel corpóreo LED con IA" },
      { name: "description", content: "Diseñá y visualizá tu próximo cartel con NPG: subí tu fachada y tu logo y mirá la simulación con IA." },
      { property: "og:title", content: "NPG — Armá tu cartel corpóreo LED" },
      { property: "og:description", content: "Corpóreo LED, Black Night, Polyfan, vinilos e impresión LED simulados en tu fachada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

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
  { icon: Layers, label: "Backlight y Polyfan", desc: "Carteles con lona o polyfan tensado e iluminación desde adentro. La imagen se ve pareja y luminosa, ideal para gráficas grandes visibles a toda hora." },
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#inicio" aria-label="NPG Diseño & Cartelería — Inicio"><img src={npgLogo.url} alt="NPG Diseño & Cartelería" width={672} height={679} className="h-11 w-auto" /></a>
        <ul className="hidden gap-7 text-sm md:flex">
          {NAV.map((n) => (
            <li key={n.id}><a href={`#${n.id}`} className="text-muted-foreground transition hover:text-foreground">{n.label}</a></li>
          ))}
        </ul>
        <button className="p-2 md:hidden" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <ul className="grid gap-1 border-t border-border px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <li key={n.id}><a onClick={() => setOpen(false)} href={`#${n.id}`} className="block rounded-lg px-3 py-3 hover:bg-accent">{n.label}</a></li>
          ))}
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
  const [foto, setFoto] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [cfg, setCfg] = useState<SignConfig>({ tipo: "Corpóreo LED", tamano: "Mediano (2 m)", colores: "", iluminacion: "Escena nocturna encendido", notas: "" });
  const [result, setResult] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof SignConfig) => (v: string) => setCfg((c) => ({ ...c, [k]: v }));

  async function generar() {
    if (!foto || !logo) return setError("Subí la foto del local y el logo.");
    setError(null); setLoading(true); setResult(null); setFinal(false);
    const form = new FormData();
    form.append("prompt", buildPrompt(cfg));
    form.append("image[]", foto);
    form.append("image[]", logo);
    try {
      await streamImage("/api/edit-image", form, (src, isFinal) => { setResult(src); setFinal(isFinal); });
    } catch (e) {
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
  const ready = !!(result && final);
  const progress = [!!foto && !!logo, true, ready, ready].filter(Boolean).length;

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Nav />

      {/* HERO */}
      <header id="inicio" className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
        <img src={spaceBg} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="starfield absolute inset-0" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-5 py-12 md:grid-cols-2">
          <div className="animate-rise text-center md:text-left">
            <img src={npgLogo.url} alt="NPG Diseño & Cartelería" width={672} height={679} className="mx-auto mb-6 h-24 w-auto drop-shadow-[0_0_24px_rgba(118,43,255,0.6)] md:mx-0 md:h-32" />
            <h1 className="text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl">
              Armá tu cartel<br /><span className="text-gradient">corpóreo LED</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground md:mx-0">Diseñá y visualizá tu próximo cartel con NPG.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <a href="#crear" className="rounded-full bg-gradient-brand px-8 py-4 text-center font-display text-sm text-primary-foreground shadow-glow transition hover:scale-[1.03]">Empezar a diseñar</a>
              <a href="#servicios" className="rounded-full border border-border px-8 py-4 text-center text-sm font-semibold transition hover:border-neon">Conocé nuestros servicios</a>
            </div>
            <p className="mt-6 text-sm tracking-widest text-muted-foreground">Diseño · Fabricación · Instalación</p>
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
      <section id="crear" className="relative scroll-mt-16 px-5 py-20">
        <div className="absolute left-1/2 top-0 h-96 w-[60rem] max-w-full -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl rounded-3xl border border-border bg-gradient-to-b from-secondary/50 to-background p-4 shadow-glow md:p-10">
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
            <Step n={1} title="Subí tus imágenes" done={!!foto && !!logo}>
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
                <div><p className="mb-3 text-sm font-semibold text-muted-foreground">Tamaño</p><Chips options={TAMANOS} value={cfg.tamano} onChange={set("tamano")} /></div>
                <div><p className="mb-3 text-sm font-semibold text-muted-foreground">Iluminación</p><Chips options={ILUMINACION} value={cfg.iluminacion} onChange={set("iluminacion")} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2"><span className="text-sm font-semibold text-muted-foreground">Colores</span>
                    <input value={cfg.colores} onChange={(e) => set("colores")(e.target.value)} placeholder="Ej: blanco cálido y dorado" className="rounded-xl border border-input bg-muted/60 px-4 py-3 outline-none transition focus:border-neon" />
                  </label>
                  <label className="grid gap-2"><span className="text-sm font-semibold text-muted-foreground">Posición / notas (opcional)</span>
                    <input value={cfg.notas} onChange={(e) => set("notas")(e.target.value)} placeholder="Ej: sobre la marquesina" className="rounded-xl border border-input bg-muted/60 px-4 py-3 outline-none transition focus:border-neon" />
                  </label>
                </div>
              </div>
            </Step>

            <Step n={3} title="Generá la simulación" done={ready}>
              <button onClick={generar} disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-4 font-display text-sm text-primary-foreground shadow-glow transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generando simulación…</> : <><Wand2 className="h-5 w-5" /> Generar con IA</>}
              </button>
              {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">{error}</p>}
              {ready && <p className="mt-4 flex items-center gap-2 text-success"><Sparkles className="h-4 w-4" /> ¡Simulación lista!</p>}
              {result ? (
                <img src={result} alt="Simulación del cartel" className={`mt-6 w-full rounded-2xl border border-border transition-[filter] duration-700 ${final ? "blur-0" : "blur-2xl"}`} />
              ) : (
                <div className="mt-6 flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-center text-muted-foreground">
                  {loading ? "La IA está trabajando en tu cartel…" : "Acá vas a ver tu cartel en la fachada"}
                </div>
              )}
            </Step>

            <Step n={4} title="Descargá y enviá" done={false}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={ready ? result! : undefined} download="npg-studio-simulacion.png" aria-disabled={!ready}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full border border-neon py-3.5 font-semibold text-neon transition hover:bg-accent ${ready ? "" : "pointer-events-none opacity-40"}`}>
                  <Download className="h-4 w-4" /> Descargar PNG
                </a>
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 font-semibold text-whatsapp-foreground transition hover:opacity-90">
                  <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
                </a>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">WhatsApp: 297 516-9780 · Adjuntá la imagen descargada al chat.</p>
            </Step>
          </div>
        </div>
      </section>

      {/* TRABAJOS */}
      <section id="trabajos" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionTitle kicker="PORTFOLIO" title="Nuestros trabajos" sub="Ideas que dejan huella." />
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-primary-glow" strokeWidth={1.5} />
          <p className="mt-4 font-display text-lg">Muy pronto</p>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">Estamos preparando la galería con nuestros proyectos reales.</p>
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
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <a href={waContact} target="_blank" rel="noreferrer" className="rounded-full bg-gradient-brand px-8 py-4 text-center font-display text-sm text-primary-foreground shadow-glow transition hover:scale-[1.03]">Contactanos</a>
              <a href={waLink} target="_blank" rel="noreferrer" className="rounded-full border border-border px-8 py-4 text-center text-sm font-semibold transition hover:border-neon">Solicitar presupuesto</a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">WhatsApp: 297 516-9780</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">© NPG Diseño & Cartelería</footer>
    </main>
  );
}
