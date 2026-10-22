import { describe, it, expect } from "vitest";
import { placementFromAnalysis, signProjection, dimensions } from "./montage-geometry";
const a = { found: true, zone: { x0: 0.2, y0: 0.1, x1: 0.8, y1: 0.3 }, doorTopY: 0.4, doorBottomY: 0.82 };
const W = 1000, H = 1000;
const width = (w: number) => { const { surface } = placementFromAnalysis(a, W, H, 0.6); const p = signProjection(surface, dimensions(w, 0.6)); return ((p[1]?.x ?? 0) - (p[0]?.x ?? 0)) * W; };
describe("ubicación por análisis de fachada", () => {
  for (const w of [2, 3, 4, 5]) it(`${w} m usa la escala de la puerta (2,1 m)`, () => expect(width(w)).toBeCloseTo(w * 420 / 2.1, 4));
  it("queda en la franja superior detectada", () => { const { surface } = placementFromAnalysis(a, W, H, 0.6); const p = signProjection(surface, dimensions(2, 0.6)); expect(Math.max(...p.map((q) => q.y))).toBeLessThanOrEqual(0.35); });
  it("rechaza un cartel que no cabe", () => expect(() => signProjection(placementFromAnalysis({ ...a, zone: { ...a.zone, x0: 0.4, x1: 0.6 } }, W, H, 1).surface, dimensions(5, 1))).toThrow("no cabe"));
  it("análisis inválido usa franja superior por defecto y se marca estimado", () => { const r = placementFromAnalysis({ ...a, zone: { x0: 0.1, y0: 0.8, x1: 0.9, y1: 0.95 } }, W, H, 0.6); expect(r.estimated).toBe(true); expect(r.surface.corners[0]?.y).toBe(0.1); });
});
