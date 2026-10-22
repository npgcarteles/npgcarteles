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
  doorComplete: z.boolean(),
  samePlane: z.boolean(),
  frontal: z.boolean(),
});

const INSTRUCTIONS = `You analyze a storefront photo for placing a commercial sign. Return normalized coordinates (0..1, origin top-left). Be precise: these coordinates drive a real-size installation.
zone: the flat wall band where a sign is normally installed — the strip of facade directly above the main entrance/shop window. It must be existing wall: never sky, roof, awning, sidewalk, glass, windows or doors. Span the full usable width of that strip.
doorTopY/doorBottomY: the FULL VISIBLE vertical extent of the customer's main entrance door including its frame, from the top of the frame to the floor. Never estimate hidden parts. Return null if not fully visible. This door is assumed to be exactly 2 meters tall. Never use neighboring doors, windows or shutters.
doorComplete=true ONLY when both floor and upper frame are clearly visible and the entrance is unambiguous. samePlane=true ONLY if that door frame lies in the installation wall plane, not recessed or projecting. frontal=true ONLY for a straight-on facade with parallel horizontal and vertical edges, no meaningful perspective foreshortening. If unsure set false. Angled photographs or recessed doors require a further physical measurement; never invent one.
zone must be wholly above the entrance and must exclude glass, doors and awnings. Never expand the band just to fit a sign. Existing signage can be replaced within its wall band. found=false if no safe installation band exists.`;

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
            maxRetries: 0,
            providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
          });
          const output = await result.output;
          return Response.json(output);
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode ?? 502;
          const safe = e instanceof Error ? e.message : "No se pudo analizar la fachada";
          return Response.json({ error: safe }, { status });
        }
      },
    },
  },
});
