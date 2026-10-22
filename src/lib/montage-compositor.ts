import { dimensions, fitLogo, homography, project, signProjection, type Surface } from "./montage-geometry";

async function load(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try { const image = new Image(); image.src = url; await image.decode(); return image; }
  finally { URL.revokeObjectURL(url); }
}
function canvas(w: number, h: number) { const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"); if (!ctx) throw new Error("Tu navegador no permite componer imágenes."); return { c, ctx }; }

/** Bilinear sample of the sign layer at fractional coordinates; transparent outside. */
function sample(src: ImageData, x: number, y: number, out: Uint8ClampedArray, o: number) {
  const fx = x - 0.5, fy = y - 0.5;
  const xa = Math.floor(fx), ya = Math.floor(fy);
  const tx = fx - xa, ty = fy - ya;
  let r = 0, g = 0, b = 0, a = 0;
  const pts: [number, number, number][] = [[xa, ya, (1 - tx) * (1 - ty)], [xa + 1, ya, tx * (1 - ty)], [xa, ya + 1, (1 - tx) * ty], [xa + 1, ya + 1, tx * ty]];
  for (const [nx, ny, w] of pts) {
    if (w === 0 || nx < 0 || ny < 0 || nx >= src.width || ny >= src.height) continue;
    const i = (ny * src.width + nx) * 4;
    r += (src.data[i] ?? 0) * w; g += (src.data[i + 1] ?? 0) * w; b += (src.data[i + 2] ?? 0) * w; a += (src.data[i + 3] ?? 0) * w;
  }
  out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
}

// Deterministic composition: the original photo is never sent to a generative model.
export async function composeMontage(photo: Blob, logo: Blob, surface: Surface, widthM: number, heightM: number, warm: boolean) {
  const d = dimensions(widthM, heightM);
  const corners = signProjection(surface, d);
  const [bg, mark] = await Promise.all([load(photo), load(logo)]);
  const { c, ctx } = canvas(bg.naturalWidth, bg.naturalHeight);
  ctx.drawImage(bg, 0, 0);

  // Sign face layer at high resolution; the logo keeps its exact proportions.
  const lw = Math.min(2400, Math.max(700, Math.round(d.widthM * 500)));
  const lh = Math.round(lw / d.aspectRatio);
  const layer = canvas(lw, lh);
  const pad = Math.round(lh * 0.14);
  const fitted = fitLogo(mark.naturalWidth, mark.naturalHeight, lw - pad * 2, lh - pad * 2);
  layer.ctx.drawImage(mark, pad + fitted.x, pad + fitted.y, fitted.width, fitted.height);
  // Opal acrylic face: soft emissive tint over the logo pixels only.
  layer.ctx.globalCompositeOperation = "source-atop";
  layer.ctx.fillStyle = warm ? "rgba(255,213,150,0.20)" : "rgba(228,240,255,0.18)";
  layer.ctx.fillRect(0, 0, lw, lh);
  layer.ctx.globalCompositeOperation = "source-over";

  // Bilinear homography warp: smooth edges, no jagged pixels.
  const pixels = layer.ctx.getImageData(0, 0, lw, lh);
  const target = corners.map((p) => ({ x: p.x * c.width, y: p.y * c.height }));
  const inverse = homography(target, [{ x: 0, y: 0 }, { x: lw, y: 0 }, { x: lw, y: lh }, { x: 0, y: lh }]);
  const x0 = Math.max(0, Math.floor(Math.min(...target.map((p) => p.x)))), y0 = Math.max(0, Math.floor(Math.min(...target.map((p) => p.y))));
  const x1 = Math.min(c.width, Math.ceil(Math.max(...target.map((p) => p.x)))), y1 = Math.min(c.height, Math.ceil(Math.max(...target.map((p) => p.y))));
  const warped = canvas(Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  const out = warped.ctx.createImageData(warped.c.width, warped.c.height);
  for (let y = 0; y < warped.c.height; y++) for (let x = 0; x < warped.c.width; x++) {
    const p = project(inverse, { x: x + x0 + 0.5, y: y + y0 + 0.5 });
    sample(pixels, p.x, p.y, out.data, (y * warped.c.width + x) * 4);
  }
  warped.ctx.putImageData(out, 0, 0);

  // Lighting & integration, strictly clipped to the sign mask.
  const glow = warm ? "255,188,105" : "208,226,255";
  const blur = Math.max(3, Math.min(16, (x1 - x0) * 0.025));
  const depth = Math.max(2, Math.round((y1 - y0) * 0.05));
  const margin = Math.ceil(blur * 4 + depth + 6);
  const mask = { x0: Math.max(0, x0 - margin), y0: Math.max(0, y0 - margin), x1: Math.min(c.width, x1 + margin), y1: Math.min(c.height, y1 + margin) };
  const original = ctx.getImageData(0, 0, c.width, c.height);
  ctx.save(); ctx.beginPath(); ctx.rect(mask.x0, mask.y0, mask.x1 - mask.x0, mask.y1 - mask.y0); ctx.clip();
  // 1. Contact shadow on the wall.
  ctx.save(); ctx.filter = "brightness(0)"; ctx.globalAlpha = 0.3; ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = blur * 0.8; ctx.shadowOffsetY = depth; ctx.drawImage(warped.c, x0 + depth * 0.4, y0 + depth); ctx.restore();
  // 2. Channel-letter depth: stacked darkened returns down-right.
  ctx.save(); ctx.filter = "brightness(0.42) saturate(0.85)"; for (let i = depth; i > 0; i--) ctx.drawImage(warped.c, x0 + i * 0.35, y0 + i * 0.7); ctx.restore();
  // 3. Edge separation: soft dark keyline so letters lift off bright walls or existing signs.
  for (let i = 0; i < 2; i++) { ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = blur * 0.6; ctx.drawImage(warped.c, x0, y0); ctx.restore(); }
  // 4. LED halo bloom: layered glow spilling onto the wall.
  for (const [b, a] of [[blur * 2.6, 0.45], [blur * 1.5, 0.65], [blur * 0.8, 0.85]] as const) {
    ctx.save(); ctx.shadowColor = `rgba(${glow},${a})`; ctx.shadowBlur = b; ctx.drawImage(warped.c, x0, y0); ctx.restore();
  }
  // 5. Lit acrylic face on top.
  ctx.save(); ctx.filter = "brightness(1.1)"; ctx.drawImage(warped.c, x0, y0); ctx.restore();
  ctx.restore();
  if (!verifyUntouched(original, ctx.getImageData(0, 0, c.width, c.height), mask)) throw new Error("La simulación modificó zonas de la foto fuera del cartel. Probá de nuevo.");
  const blob = await new Promise<Blob>((resolve, reject) => c.toBlob((b) => b ? resolve(b) : reject(new Error("No se pudo exportar el montaje.")), "image/png"));
  return { blob, corners, dimensions: d, mask, face: { canvas: warped.c, x: x0, y: y0 } };
}
/** True when every pixel outside the mask is identical to the original photo. */
export function verifyUntouched(a: ImageData, b: ImageData, m: { x0: number; y0: number; x1: number; y1: number }) {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    if (x >= m.x0 && x < m.x1 && y >= m.y0 && y < m.y1) continue;
    const i = (y * a.width + x) * 4;
    if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2] || a.data[i + 3] !== b.data[i + 3]) return false;
  }
  return true;
}
