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
          const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
            ? error.code
            : error instanceof Error ? error.name : "SUPABASE_ERROR";
          return Response.json({ error: "No se pudo consultar el límite de muestras.", code }, {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});

