import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "@/lib/ai/run-id.server";

const box = z.object({ x0: z.number(), y0: z.number(), x1: z.number(), y1: z.number() });
const schema = z.object({
  found: z.boolean(),
  zone: box,
  doorTopY: z.number().nullable(),
  doorBottomY: z.number().nullable(),
});

const INSTRUCTIONS = `You analyze a storefront photo for placing a sign. Return normalized coordinates (0..1, origin top-left).
zone: the flat wall band where a commercial sign is normally installed — above the main entrance/shop window, on the upper strip of the facade. It must be existing wall, not sky, roof, sidewalk, windows or doors.
doorTopY/doorBottomY: vertical extent of the main entrance door (null if no door is visible).
found=false if there is no reasonable installation band.`;

export const Route = createFileRoute("/api/analyze-facade")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "Falta configuración" }, { status: 500 });
        const { image } = (await request.json()) as { image?: string };
        if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > 4_000_000)
          return Response.json({ error: "Imagen no válida" }, { status: 400 });
        const runId = createLovableAiGatewayRunIdFetch();
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runId.fetch,
        });
        try {
          const result = streamText({
            model: provider.responses("openai/gpt-6-astra"),
            instructions: INSTRUCTIONS,
            messages: [{ role: "user", content: [{ type: "text", text: "Analyze this storefront." }, { type: "image", image }] }],
            output: Output.object({ schema }),
            abortSignal: request.signal,
            providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
          } as Parameters<typeof streamText>[0]);
          const output = await result.output;
          return Response.json(output);
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode ?? 502;
          console.error("analyze-facade", e);
          return Response.json({ error: "No se pudo analizar la fachada" }, { status });
        }
      },
    },
  },
});
