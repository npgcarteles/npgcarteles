import { ArrowRight, Check, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIGN_CATALOG, formatARS, WORKSHOP_MAP_URL } from "@/lib/orders.shared";
import bocados from "@/assets/trabajo-bocados.png.asset.json";
import aroma from "@/assets/trabajo-panaderia-aroma.png.asset.json";
import chipa from "@/assets/trabajo-senor-chipa.png.asset.json";
import queso from "@/assets/trabajo-punto-queso.png.asset.json";

const examples = [bocados, aroma, chipa, queso];

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

export function StoreCatalog({ width, onSelect }: { width: number; onSelect: (width: number, height: number) => void }) {
  return <div>
    <div className="mb-8 max-w-3xl">
      <p className="mb-3 text-sm font-semibold text-neon">NPG CARTELERÍA · CORPÓREO LED</p>
      <h2 className="text-2xl leading-tight sm:text-4xl">CARTELES LINDOS AL MEJOR PRECIO</h2>
      <p className="mt-5 text-xl font-semibold">Comprá tu cartel de NPG, listo para instalar 💫🙌🏻</p>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Elegí tu medida, personalizá tu diseño y recibí tu cartel listo para instalar. Una forma fácil y accesible de darle más presencia a tu negocio.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SIGN_CATALOG.map((item, index) => <article key={item.width} className={`overflow-hidden rounded-lg border bg-card ${width === item.width ? "border-neon ring-1 ring-neon" : "border-border"}`}>
        <img src={examples[index]?.url} alt={`Ejemplo ilustrativo de cartelería comercial para la opción de ${item.width} metros`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
        <div className="p-5">
          <p className="text-xs text-muted-foreground">Corpóreo LED · Imagen ilustrativa</p>
          <p className="mt-3 text-3xl font-bold">{item.width} metros</p>
          <p className="mt-2 text-2xl font-bold">{formatARS(item.price)}</p>
          <p className="mt-1 text-xs text-muted-foreground">ARS · Precio del cartel</p>
          <Button type="button" onClick={() => onSelect(item.width, item.height)} aria-pressed={width === item.width} variant={width === item.width ? "secondary" : "outline"} className="mt-5 h-11 w-full rounded-md px-2 shadow-none">{width === item.width ? <Check /> : <ArrowRight />} Elegir esta medida</Button>
          <p aria-live="polite" className="mt-2 min-h-5 text-center text-xs text-neon">{width === item.width ? "Medida seleccionada" : ""}</p>
        </div>
      </article>)}
    </div>
    <InstallationNotice />
  </div>;
}