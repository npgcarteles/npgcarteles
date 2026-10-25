import { createFileRoute } from "@tanstack/react-router";
import { editImage, imageSettings } from "@/lib/image-gateway.server";
import { finishGeneration, hashClientIp, reserveGeneration } from "@/lib/generation-quota.server";

export const Route = createFileRoute("/api/edit-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["OPENAI_API_KEY"];
        if (!apiKey) return new Response("Missing OPENAI_API_KEY", { status: 500 });
        const ipHash = hashClientIp(request);
        if (!ipHash) return Response.json({ error: { message: "No se pudo identificar la conexión para aplicar el límite de muestras." } }, { status: 503 });

        let reservationId: string | null = null;
        try {
          reservationId = await reserveGeneration(ipHash);
          if (!reservationId) {
            return Response.json({ error: { message: "Ya se usaron las 2 muestras disponibles desde esta conexión. Escribinos por WhatsApp para seguir." } }, { status: 429 });
          }

          const form = await request.formData();
          // Keep the response format observable so failed or interrupted generations release the reservation.
          form.set("stream", "true");
          const upstream = await editImage({ ...imageSettings, apiKey }, form);
          if (!upstream.ok || !upstream.body) {
            await finishGeneration(reservationId, false);
            reservationId = null;
            return new Response(upstream.body, {
              status: upstream.status,
              headers: {
                "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
                "Cache-Control": "no-cache",
              },
            });
          }

          const id = reservationId;
          let completed = false;
          let finalized = false;
          const finalize = async (success: boolean) => {
            if (finalized) return;
            finalized = true;
            try {
              await finishGeneration(id, success);
            } catch (error) {
              console.error("[edit-image] No se pudo cerrar la reserva de muestra", error);
            }
          };
          const decoder = new TextDecoder();
          let tail = "";
          const observedBody = upstream.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              tail = (tail + decoder.decode(chunk, { stream: true })).slice(-512);
              if (/event:\s*image_edit\.completed/.test(tail)) completed = true;
              controller.enqueue(chunk);
            },
            async flush() {
              await finalize(completed);
            },
          }));
          return new Response(observedBody, {
            status: upstream.status,
            headers: {
              "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
              "Cache-Control": "no-cache",
            },
          });
        } catch (error) {
          if (reservationId) {
            try { await finishGeneration(reservationId, false); }
            catch (finishError) { console.error("[edit-image] No se pudo liberar una reserva fallida", finishError); }
          }
          console.error("[edit-image] No se pudo iniciar la generación", error);
          return Response.json({ error: { message: "No se pudo iniciar la generación. Probá de nuevo." } }, { status: 503 });
        }
      },
    },
  },
});


