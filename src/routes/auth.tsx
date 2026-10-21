import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader } from "@/components/site-header";

const safe = (r?: string) => (r && r.startsWith("/") && !r.startsWith("//") ? r : "/pedidos");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Ingresar — NPG Studio" },
      { name: "description", content: "Ingresá o creá tu cuenta en NPG Studio para confirmar y pagar tu cartel." },
      { property: "og:title", content: "Ingresar — NPG Studio" },
      { property: "og:description", content: "Tu cuenta para seguir tus pedidos de cartelería NPG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const to = safe(redirect);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to, replace: true }); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to, replace: true }); });
    return () => sub.subscription.unsubscribe();
  }, [to, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setMsg({ t: "err", m: "Email o contraseña incorrectos, o tu email todavía no fue confirmado." });
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(to)}` } });
      setMsg(error ? { t: "err", m: error.message } : { t: "ok", m: "Te enviamos un email para confirmar tu cuenta. Después volvé a ingresar." });
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth?redirect=${encodeURIComponent(to)}` });
    if (r.error) setMsg({ t: "err", m: "No se pudo ingresar con Google." });
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-glow">
          <h1 className="text-center text-2xl">{mode === "in" ? "Ingresá a tu cuenta" : "Creá tu cuenta"}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Para confirmar tu pedido y seguir su estado.</p>
          <button onClick={google} className="mt-6 w-full rounded-full border border-border py-3 font-semibold transition hover:border-neon">Continuar con Google</button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />o con email<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="grid gap-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-input bg-muted/60 px-4 py-3 outline-none focus:border-neon" />
            <input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contraseña" className="rounded-xl border border-input bg-muted/60 px-4 py-3 outline-none focus:border-neon" />
            <button disabled={busy} className="flex items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 font-display text-sm text-primary-foreground shadow-glow disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "in" ? "Ingresar" : "Crear cuenta"}
            </button>
          </form>
          {msg && <p role="alert" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${msg.t === "ok" ? "border-success/50 text-success" : "border-destructive/50 text-destructive"}`}>{msg.m}</p>}
          <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="mt-5 w-full text-sm text-neon hover:underline">
            {mode === "in" ? "¿No tenés cuenta? Creala acá" : "¿Ya tenés cuenta? Ingresá"}
          </button>
        </div>
      </div>
    </main>
  );
}
