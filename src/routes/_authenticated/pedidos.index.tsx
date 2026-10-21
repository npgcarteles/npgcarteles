import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { listMyOrders } from "@/lib/orders.functions";
import { formatARS, formatNumero, STATUS_LABEL, type OrderStatus } from "@/lib/orders.shared";

const q = queryOptions({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });

export const Route = createFileRoute("/_authenticated/pedidos/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  head: () => ({
    meta: [
      { title: "Mis pedidos — NPG Studio" },
      { name: "description", content: "Consultá el estado de tus pedidos de cartelería NPG." },
      { property: "og:title", content: "Mis pedidos — NPG Studio" },
      { property: "og:description", content: "Estado de tus carteles y pagos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  const { data } = useSuspenseQuery(q);
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-3xl">Mis pedidos</h1>
        {data.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p>Todavía no hiciste pedidos.</p>
            <Link to="/" hash="crear" className="mt-3 inline-block text-neon underline">Diseñar mi cartel</Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3">
            {data.map((o) => {
              const cfg = o.config as { ancho: number; alto: number; tipo: string };
              return (
                <li key={o.id}>
                  <Link to="/pedidos/$id" params={{ id: o.id }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition hover:border-neon">
                    <div>
                      <p className="font-display text-sm">{formatNumero(o.numero)}</p>
                      <p className="text-sm text-muted-foreground">{cfg.tipo} · {cfg.ancho} × {cfg.alto} m · {new Date(o.created_at).toLocaleDateString("es-AR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neon">{STATUS_LABEL[o.status as OrderStatus]}</p>
                      <p className="text-sm text-muted-foreground">{o.total_ars != null ? formatARS(o.total_ars) : "Presupuesto pendiente"}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
