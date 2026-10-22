import { streamImage } from "./stream-image";

type Rect = { x0: number; y0: number; x1: number; y1: number };

function toBlob(c: HTMLCanvasElement) {
  return new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("No se pudo exportar."))), "image/png"));
}
async function load(src: Blob | string) {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  const img = new Image(); img.src = url; await img.decode();
  if (typeof src !== "string") URL.revokeObjectURL(url);
  return img;
}

/**
 * AI only re-renders the sign area (masked edit) to make it a built, lit sign.
 * The result is pasted back ONLY inside the mask onto the original-size montage,
 * so the rest of the photo stays pixel-identical and size/position stay fixed.
 */
export async function enhanceSign(montage: Blob, signMask: Rect, face: { canvas: HTMLCanvasElement; x: number; y: number }, warm: boolean, onPreview?: (url: string) => void) {
  const base = await load(montage);
  const W = base.naturalWidth, H = base.naturalHeight;
  const pad = Math.max(8, (signMask.y1 - signMask.y0) * 0.25);
  const mask = { x0: Math.max(0, signMask.x0 - pad), y0: Math.max(0, signMask.y0 - pad), x1: Math.min(W, signMask.x1 + pad), y1: Math.min(H, signMask.y1 + pad) };
  const m = document.createElement("canvas"); m.width = W; m.height = H;
  const mctx = m.getContext("2d"); if (!mctx) throw new Error("Tu navegador no permite componer imágenes.");
  mctx.fillStyle = "#000"; mctx.fillRect(0, 0, W, H);
  mctx.clearRect(mask.x0, mask.y0, mask.x1 - mask.x0, mask.y1 - mask.y0);
  const form = new FormData();
  form.append("image", new File([montage], "montaje.png", { type: "image/png" }));
  form.append("quality", "high");
  form.append("prompt", [
    "This photo has a flat logo pasted on the facade wall. Keep that logo exactly where it is, same letters, shapes, colors and size.",
    "Turn that exact logo into a real, professionally built Corpóreo LED sign: 3D channel letters about 5-8 cm deep with returns, opal acrylic faces, standoff mounting, subtle contact shadow on the wall.",
    `The sign is turned on: backlit ${warm ? "warm white (about 3000K)" : "cool white (about 6000K)"} LED glow on the faces and a soft halo on the wall right behind the letters.`,
    "Keep the logo shapes, letters, colors, size, proportions and position exactly the same. Do not add words, frames, panels or boxes. Do not change anything else in the photo; keep the framing, the photo's perspective and lighting.",
  ].join(" "));
  let final = "";
  await streamImage("/api/edit-image", form, (url, isFinal) => { if (isFinal) final = url; else onPreview?.(url); });
  if (!final) throw new Error("La IA no devolvió la imagen iluminada.");
  const ai = await load(final);
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const ctx = out.getContext("2d"); if (!ctx) throw new Error("Tu navegador no permite componer imágenes.");
  ctx.drawImage(base, 0, 0);
  const sx = ai.naturalWidth / W, sy = ai.naturalHeight / H;
  const w = mask.x1 - mask.x0, h = mask.y1 - mask.y0;
  ctx.drawImage(ai, mask.x0 * sx, mask.y0 * sy, w * sx, h * sy, mask.x0, mask.y0, w, h);
  // Re-apply the exact original logo faces so the AI can never substitute or alter the logo.
  ctx.drawImage(face.canvas, face.x, face.y);
  return toBlob(out);
}
