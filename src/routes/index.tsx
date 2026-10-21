import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import hero from "@/assets/hero.jpg";
import { streamImage } from "@/lib/stream-image";
import { buildPrompt, ILUMINACION, TAMANOS, TIPOS, type SignConfig } from "@/lib/sign-prompt";

const WHATSAPP = "5492975169780";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NPG Studio — Simulá tu cartel con IA" },
      { name: "description", content: "Subí la foto de tu local y tu logo, elegí el cartel y mirá cómo quedaría con IA." },
      { property: "og:title", content: "NPG Studio — Simulá tu cartel con IA" },
      { property: "og:description", content: "Corpóreo LED, Black Night, Polyfan, vinilos e impresión LED simulados en tu fachada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Upload({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  return (
    <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition hover:border-primary">
      {file ? (
        <img src={URL.createObjectURL(file)} alt={label} className="h-full w-full object-contain" />
      ) : (
        <span className="px-4 text-center text-muted-foreground">
          <span className="block font-display text-2xl text-foreground">{label}</span>
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
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-2 text-sm transition ${value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary hover:border-primary"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <h2 className="mb-5 flex items-center gap-3 text-3xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-xl text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Index() {
  const [foto, setFoto] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [cfg, setCfg] = useState<SignConfig>({ tipo: TIPOS[0].id, tamano: TAMANOS[1], colores: "", iluminacion: ILUMINACION[3], notas: "" });
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

  return (
    <main className="min-h-screen">
      <header className="relative flex min-h-[70vh] items-end overflow-hidden">
        <img src={hero} alt="Fachada con cartel corpóreo LED de noche" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative mx-auto w-full max-w-5xl px-6 pb-16">
          <p className="font-display text-2xl tracking-widest text-primary">NPG Studio</p>
          <h1 className="mt-2 text-6xl leading-none md:text-8xl">Mirá tu cartel<br />antes de hacerlo</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">Subí, configurá, generá y descargá. Nuestra IA integra el cartel en la foto de tu local de forma realista.</p>
          <a href="#crear" className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">Empezar</a>
        </div>
      </header>

      <div id="crear" className="mx-auto grid max-w-5xl gap-6 px-6 py-16">
        <Step n={1} title="Subir">
          <div className="grid gap-4 sm:grid-cols-2">
            <Upload label="Foto del local" file={foto} onFile={setFoto} />
            <Upload label="Tu logo" file={logo} onFile={setLogo} />
          </div>
        </Step>

        <Step n={2} title="Configurar">
          <div className="grid gap-6">
            <div>
              <p className="mb-3 font-semibold">Tipo de cartel</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TIPOS.map((t) => (
                  <button key={t.id} type="button" onClick={() => set("tipo")(t.id)}
                    className={`rounded-xl border p-4 text-left transition ${cfg.tipo === t.id ? "border-primary bg-accent shadow-glow" : "border-border bg-secondary hover:border-primary"}`}>
                    <span className="block font-display text-xl">{t.id}</span>
                    <span className="text-sm text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div><p className="mb-3 font-semibold">Tamaño</p><Chips options={TAMANOS} value={cfg.tamano} onChange={set("tamano")} /></div>
            <div><p className="mb-3 font-semibold">Iluminación</p><Chips options={ILUMINACION} value={cfg.iluminacion} onChange={set("iluminacion")} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2"><span className="font-semibold">Colores</span>
                <input value={cfg.colores} onChange={(e) => set("colores")(e.target.value)} placeholder="Ej: blanco cálido y dorado" className="rounded-lg border border-input bg-muted px-4 py-3 outline-none focus:border-primary" />
              </label>
              <label className="grid gap-2"><span className="font-semibold">Notas (opcional)</span>
                <input value={cfg.notas} onChange={(e) => set("notas")(e.target.value)} placeholder="Ej: sobre la marquesina" className="rounded-lg border border-input bg-muted px-4 py-3 outline-none focus:border-primary" />
              </label>
            </div>
          </div>
        </Step>

        <Step n={3} title="Generar">
          <button onClick={generar} disabled={loading} className="w-full rounded-full bg-primary py-4 font-display text-2xl text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50">
            {loading ? "Generando simulación…" : "Generar con IA"}
          </button>
          {error && <p className="mt-4 text-destructive">{error}</p>}
          {result && (
            <img src={result} alt="Simulación del cartel" className={`mt-6 w-full rounded-xl transition-[filter] duration-700 ${final ? "blur-0" : "blur-2xl"}`} />
          )}
        </Step>

        <Step n={4} title="Descargar">
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={result && final ? result : undefined} download="npg-studio-simulacion.png"
              className={`flex-1 rounded-full border border-primary py-3 text-center font-semibold text-primary transition hover:bg-accent ${result && final ? "" : "pointer-events-none opacity-40"}`}>
              Descargar PNG
            </a>
            <a href={`https://wa.me/${WHATSAPP}?text=${waText}`} target="_blank" rel="noreferrer"
              className="flex-1 rounded-full bg-whatsapp py-3 text-center font-semibold text-whatsapp-foreground transition hover:opacity-90">
              Enviar por WhatsApp
            </a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">WhatsApp: 297 516-9780 · Adjuntá la imagen descargada al chat.</p>
        </Step>
      </div>
    </main>
  );
}
