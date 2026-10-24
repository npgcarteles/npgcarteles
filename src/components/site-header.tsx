import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSessionEmail() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setEmail(user?.email ?? null);
      if (user) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!r);
      } else setIsAdmin(false);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") load(); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { email, isAdmin };
}

export function AccountLinks({ className = "" }: { className?: string }) {
  const { email, isAdmin } = useSessionEmail();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function salir() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  if (email === undefined) return null;
  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      {email ? (
        <>
          {isAdmin && <Link to="/admin" className="text-neon hover:underline">Panel NPG</Link>}
          <Link to="/pedidos" className="text-muted-foreground hover:text-foreground">Mis pedidos</Link>
          <button onClick={salir} className="text-muted-foreground hover:text-foreground">Salir</button>
        </>
      ) : (
        <Link to="/auth" className="rounded-full border border-border px-4 py-1.5 hover:border-neon">Ingresar</Link>
      )}
    </div>
  );
}

export function SiteHeader() {
  return (
    <nav className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" aria-label="NPG — Inicio"><img src={"/assets/npg-logo.png"} alt="NPG Diseño & Cartelería" width={189} height={133} className="h-8 w-auto" /></Link>
        <AccountLinks />
      </div>
    </nav>
  );
}

const STEPS = ["Diseño", "Pedido", "Pago", "Confirmación"];
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="mx-auto mb-8 flex max-w-xl items-center justify-between gap-2 text-xs sm:text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-display text-xs ${i <= current ? "border-neon bg-gradient-brand text-primary-foreground" : "border-border text-muted-foreground"}`}>{i + 1}</span>
          <span className={i <= current ? "font-semibold" : "text-muted-foreground"}>{s}</span>
          {i < STEPS.length - 1 && <span className={`hidden h-px flex-1 sm:block ${i < current ? "bg-neon" : "bg-border"}`} />}
        </li>
      ))}
    </ol>
  );
}



