import { createFileRoute } from "@tanstack/react-router";
import { applyPayment, getPayment, verifyWebhookSignature } from "@/lib/mercadopago.server";

export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
        try { body = await request.json(); } catch { /* query-only notifications */ }
        const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
        const dataId = String(url.searchParams.get("data.id") ?? body.data?.id ?? "");
        if (type !== "payment" || !/^\d{1,20}$/.test(dataId)) return new Response("ignored", { status: 200 });
        if (!(await verifyWebhookSignature(request, dataId))) return new Response("invalid signature", { status: 401 });
        try {
          // Never trust the notification body: read the real state from Mercado Pago.
          const payment = await getPayment(dataId);
          if (payment) await applyPayment(payment);
          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("MP webhook error", e instanceof Error ? e.message : e);
          return new Response("retry", { status: 500 });
        }
      },
    },
  },
});
