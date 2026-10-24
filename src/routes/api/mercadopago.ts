import { createFileRoute } from "@tanstack/react-router";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { SIGN_CATALOG } from "@/lib/orders.shared";

export const Route = createFileRoute("/api/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["MP_ACCESS_TOKEN"] || process.env["MP_ACCES_TOKEN"] || process.env["MERCADOPAGO_ACCESS_TOKEN"];
        if (!token) return Response.json({ error: "Falta configurar MP_ACCESS_TOKEN" }, { status: 500 });
        let data: { width?: number; height?: number; businessName?: string };
        try { data = await request.json(); } catch { return Response.json({ error: "Solicitud inválida" }, { status: 400 }); }
        const item = SIGN_CATALOG.find((entry) => entry.width === data.width && entry.height === data.height);
        if (!item) return Response.json({ error: "La medida elegida no pertenece al catálogo" }, { status: 400 });
        const businessName = typeof data.businessName === "string" ? data.businessName.trim().slice(0, 80) : "";
        const origin = new URL(request.url).origin;
        try {
          const client = new MercadoPagoConfig({ accessToken: token });
          const preference = new Preference(client);
          const result = await preference.create({
            body: {
              items: [{ id: `npg-cartel-${item.width}m`, title: `NPG Cartelería${businessName ? ` — ${businessName}` : ""}`, quantity: 1, unit_price: item.price, currency_id: "ARS" }],
              back_urls: { success: origin, failure: origin, pending: origin },
              ...(origin.startsWith("https://") ? { auto_return: "approved" as const } : {}),
            },
          });
          if (!result.init_point) throw new Error("Mercado Pago no devolvió init_point");
          return Response.json({ init_point: token.startsWith("TEST-") ? result.sandbox_init_point ?? result.init_point : result.init_point });
        } catch (error) {
          console.error("Mercado Pago preference error", error instanceof Error ? error.message : error);
          return Response.json({ error: "No se pudo iniciar el pago con Mercado Pago" }, { status: 502 });
        }
      },
    },
  },
});
