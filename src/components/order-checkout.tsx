import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Handshake, Loader2, LockKeyhole, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatARS, type PaymentKind, type PaymentOption } from "@/lib/orders.shared";
import npgLogo from "@/assets/npg-logo.png.asset.json";

export function CheckoutHeader() {
  return (
    <header className="border-b border-border">
      <div className="relative mx-auto flex h-24 max-w-5xl items-center justify-center px-6">
        <Button asChild variant="ghost" size="icon" className="absolute left-4" title="Volver a mis pedidos">
          <Link to="/pedidos" aria-label="Volver a mis pedidos"><ArrowLeft /></Link>
        </Button>
        <Link to="/" aria-label="NPG — Inicio"><img src={npgLogo.url} alt="NPG Diseño & Cartelería" className="checkout-logo h-20 w-20 object-contain" /></Link>
        <Button asChild variant="ghost" size="icon" className="absolute right-4" title="Mis pedidos">
          <Link to="/pedidos" aria-label="Mis pedidos"><ShoppingBag className="size-6" /></Link>
        </Button>
      </div>
    </header>
  );
}

type Props = {
  total: number | null;
  paid: number;
  options: PaymentOption[];
  selected: PaymentOption | undefined;
  isOwner: boolean;
  busy: boolean;
  error: string | null;
  quoteNote: string | null;
  onKind: (kind: PaymentKind) => void;
  onPay: () => void;
};

export function OrderCheckout({ total, paid, options, selected, isOwner, busy, error, quoteNote, onKind, onPay }: Props) {
  const canPay = isOwner && !busy && total != null;
  const [method, setMethod] = useState("");
  function chooseMethod(value: string) {
    if (!canPay || !["mp-cards", "mp"].includes(value)) return;
    setMethod(value);
    onPay();
  }

  return (
    <section aria-label="Pago del pedido">
      <div className="bg-muted px-6 py-5 text-base font-bold">
        Total del cartel {total == null ? "· Pendiente de presupuesto" : formatARS(total)}
        <p className="mt-2 text-xs font-normal text-muted-foreground">No incluye instalación; se cotiza por separado.</p>
      </div>
      <div className="px-6 py-7">
        {options.length > 1 && isOwner && (
          <fieldset className="mt-8">
            <legend className="mb-3 text-base font-bold">Modalidad de pago</legend>
            <RadioGroup value={selected?.kind ?? ""} onValueChange={(v) => { const o = options.find((item) => item.kind === v); if (o) { onKind(o.kind); setMethod(""); } }} disabled={busy}>
              {options.map((o) => <label key={o.kind} className="flex cursor-pointer items-center gap-3 border-b border-border py-3 text-sm"><RadioGroupItem value={o.kind} /><span className="flex-1">{o.label}</span><span className="font-semibold">{formatARS(o.amount)}</span></label>)}
            </RadioGroup>
          </fieldset>
        )}

        <h2 className="mb-2 mt-9 text-xl font-bold">Método de pago</h2>
        <RadioGroup aria-label="Método de pago" value={method} onValueChange={chooseMethod} className="gap-0">
          <PaymentRow value="mp" disabled={!canPay} title="MERCADO PAGO" note="Tarjetas y medios disponibles en el checkout seguro de Mercado Pago" />
        </RadioGroup>

        <div className="mt-6 space-y-3 text-sm">
          {total == null && <p className="text-muted-foreground">NPG está preparando tu presupuesto. El pago se habilita cuando esté confirmado.</p>}
          {paid > 0 && <p className="flex justify-between"><span>Pagado</span><span>{formatARS(paid)}</span></p>}
          {paid > 0 && total != null && total > paid && <p className="flex justify-between"><span>Saldo pendiente</span><span>{formatARS(total - paid)}</span></p>}
          {selected && isOwner && <p className="flex justify-between font-bold"><span>Pagás ahora</span><span>{formatARS(selected.amount)}</span></p>}
          {!selected && total != null && isOwner && <p className="flex justify-between font-bold"><span>Pagás ahora</span><span>{formatARS(total)}</span></p>}
          {quoteNote && <p className="border-l-2 border-border pl-3 text-muted-foreground">{quoteNote}</p>}
          {busy && <p role="status" className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Abriendo Mercado Pago…</p>}
          {error && <p role="alert" className="text-destructive">{error}</p>}
          {error && isOwner && <Button onClick={onPay} disabled={busy} className="w-full rounded-none shadow-none">Reintentar pago</Button>}
          <p className="flex items-start gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-4 shrink-0" /> Pago seguro con Mercado Pago. NPG no guarda datos de tarjetas.</p>
        </div>
      </div>
    </section>
  );
}

function PaymentRow({ value, disabled, title, note }: { value: string; disabled: boolean; title: string; note?: string }) {
  return <label className={`flex min-h-24 items-center gap-4 border-b border-border py-5 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
    <RadioGroupItem value={value} disabled={disabled} aria-label={title} className="size-5 shrink-0 shadow-none" />
    <Handshake aria-label="Mercado Pago" className="size-9 shrink-0 text-payment-brand" strokeWidth={1.5} />
    <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium leading-5">{title}</span>{note && <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{note}</span>}</span>
  </label>;
}

export function CheckoutWhatsApp() {
  return <Button asChild size="icon" className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-whatsapp text-whatsapp-foreground shadow-none hover:bg-whatsapp/90" title="Consultar a NPG por WhatsApp"><a href="https://wa.me/5492975169780" target="_blank" rel="noopener noreferrer" aria-label="Consultar a NPG por WhatsApp"><MessageCircle className="size-7" /></a></Button>;
}
