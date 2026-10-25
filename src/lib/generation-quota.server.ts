import { createHmac } from "node:crypto";
import { isIP } from "node:net";

function clientIp(request: Request): string | null {
  // Vercel appends the connecting client address to this trusted proxy chain.
  const forwarded = request.headers.get("x-forwarded-for");
  const candidates = forwarded?.split(",").map((value) => value.trim()).reverse() ?? [];
  candidates.push(request.headers.get("x-real-ip")?.trim() ?? "");
  return candidates.find((value) => isIP(value) !== 0) ?? null;
}

export function hashClientIp(request: Request): string | null {
  const ip = clientIp(request);
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!ip || !secret) return null;
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function reserveGeneration(ipHash: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("reserve_generation_sample", { p_ip_hash: ipHash });
  if (error) throw error;
  return typeof data === "string" ? data : null;
}

export async function finishGeneration(reservationId: string, succeeded: boolean): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any).rpc("finish_generation_sample", {
    p_reservation_id: reservationId,
    p_succeeded: succeeded,
  });
  if (error) throw error;
}

export async function generationUsage(ipHash: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("generation_sample_usage", { p_ip_hash: ipHash });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

