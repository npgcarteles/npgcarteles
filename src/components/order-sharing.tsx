import { useEffect, useState } from "react";
import { Check, Copy, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { instagramOrderUrl, orderSummary, whatsappOrderUrl } from "@/lib/order-sharing";

export function OrderSharing({ order }: { order: Parameters<typeof orderSummary>[0] }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  useEffect(() => { setUrl(`${window.location.origin}${window.location.pathname}`); }, []);
  const summary = orderSummary(order, url);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setManualCopy(false);
    } catch {
      setManualCopy(true);
    }
  }

  return <section aria-label="Enviar pedido a NPG" className="mt-6 border-y border-border py-6">
    <h2 className="text-base font-bold">Enviar pedido a NPG</h2>
    <div className="mt-4 flex flex-wrap gap-3">
      <Button asChild disabled={!url} className="rounded-none shadow-none"><a href={url ? whatsappOrderUrl(summary) : undefined} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" /> Enviar por WhatsApp</a></Button>
      <Button asChild variant="outline" className="rounded-none shadow-none"><a href={instagramOrderUrl} target="_blank" rel="noopener noreferrer"><Instagram className="size-4" /> Abrir Instagram</a></Button>
      <Button variant="ghost" onClick={copySummary} disabled={!url} className="rounded-none shadow-none">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Resumen copiado" : "Copiar resumen"}</Button>
    </div>
    {copied && <p role="status" className="mt-3 text-xs text-muted-foreground">Resumen copiado para Instagram.</p>}
    {manualCopy && <textarea aria-label="Resumen del pedido para copiar" readOnly value={summary} onFocus={(event) => event.currentTarget.select()} className="mt-3 min-h-48 w-full border border-input bg-background p-3 text-sm text-foreground" />}
  </section>;
}