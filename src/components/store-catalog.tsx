import { Check, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIGN_CATALOG, formatARS, WORKSHOP_MAP_URL } from "@/lib/orders.shared";

export function InstallationNotice() {
  return <div role="note" className="my-5 border-l-4 border-neon bg-muted px-5 py-4">
    <p className="flex items-start gap-2 font-bold"><Info className="mt-0.5 size-5 shrink-0" />IMPORTANTE: los precios no incluyen instalación.</p>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">El precio corresponde al cartel. La instalación se cotiza por separado, si necesitás ese servicio.</p>
  </div>;
}

export function WorkshopPickup() {
  return <section aria-label="Retiro gratuito" className="border-y border-border py-6">
    <div className="flex items-start gap-3"><MapPin className="mt-1 size-6 shrink-0 text-neon" /><div>
      <h3 className="text-base leading-7">RETIRO GRATIS EN TALLER ÁREA 51 📍</h3>
      <p className="mt-2 text-sm leading-6">Comprá tu cartel de NPG y retiralo gratis en nuestro taller. ¡Listo para instalar!</p>
      <p className="mt-2 text-sm text-muted-foreground">Retiro gratuito. La instalación se cobra por separado.</p>
      <Button asChild variant="outline" className="mt-4 rounded-md shadow-none"><a href={WORKSHOP_MAP_URL} target="_blank" rel="noopener noreferrer"><MapPin /> CÓMO LLEGAR</a></Button>
    </div></div>
  </section>;
}

export function CatalogHeading() {
  return <div className="mb-8 max-w-3xl">
      <p className="mb-3 text-sm font-semibold text-neon">NPG CARTELERÍA · CORPÓREO LED</p>
      <h2 className="text-2xl leading-tight sm:text-4xl">CARTELES LINDOS AL MEJOR PRECIO</h2>
      <p className="mt-5 text-xl font-semibold">Comprá tu cartel de NPG, listo para instalar 💫🙌🏻</p>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Elegí tu medida, personalizá tu diseño y recibí tu cartel listo para instalar. Una forma fácil y accesible de darle más presencia a tu negocio.</p>
    </div>;
}

export function StoreCatalog({ width, onSelect }: { width: number; onSelect: (width: number, height: number) => void }) {
  return <div role="group" aria-label="Medida y precio del cartel" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {SIGN_CATALOG.map((item) => <Button key={item.width} type="button" onClick={() => onSelect(item.width, item.height)} aria-pressed={width === item.width} variant="outline" className={`relative flex h-24 min-w-0 flex-col gap-2 rounded-lg px-2 shadow-none ${width === item.width ? "border-neon bg-accent text-foreground ring-1 ring-neon" : "border-border bg-secondary/50"}`}>
      <span className="text-base font-bold sm:text-lg">{item.width} Metros</span>
      <span className="text-sm font-semibold">{formatARS(item.price)}</span>
      {width === item.width && <Check aria-hidden="true" className="absolute right-2 top-2 size-3 text-neon" />}
    </Button>)}
  </div>;
}