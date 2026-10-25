import { createFileRoute } from "@tanstack/react-router";
import { generationUsage, hashClientIp } from "@/lib/generation-quota.server";

export const Route = createFileRoute("/api/generation-usage")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ipHash = hashClientIp(request);
        if (!ipHash) return Response.json({ error: "No se pudo identificar la conexión." }, { status: 503 });
        try {
          return Response.json({ used: await generationUsage(ipHash), limit: 2 }, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch (error) {
          console.error("[generation-usage] No se pudo leer el límite", error);
          return Response.json({ error: "No se pudo consultar el límite de muestras." }, { status: 503 });
        }
      },
    },
  },
});

