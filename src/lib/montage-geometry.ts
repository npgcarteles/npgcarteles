import { Matrix, solve } from "ml-matrix";

export type Point = { x: number; y: number };
export type Surface = { corners: Point[]; widthM: number; heightM: number; measured: boolean; center: Point };
export type Dimensions = { widthM: number; heightM: number; aspectRatio: number; source: "customer_selection" };
export function dimensions(widthM: number, heightM: number): Dimensions {
  if (!Number.isFinite(widthM) || !Number.isFinite(heightM) || widthM <= 0 || heightM <= 0) throw new Error("Las medidas deben ser positivas.");
  return { widthM, heightM, aspectRatio: widthM / heightM, source: "customer_selection" };
}

export function validateSurface(s: Surface) {
  if (s.corners.length !== 4 || s.corners.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) throw new Error("Marcá las cuatro esquinas de una superficie rectangular.");
  if (!Number.isFinite(s.widthM) || !Number.isFinite(s.heightM) || s.widthM <= 0 || s.heightM <= 0) throw new Error("Ingresá las medidas reales de la superficie.");
  if (![s.center.x,s.center.y].every((v)=>Number.isFinite(v)&&v>=0&&v<=1)) throw new Error("La ubicación debe estar dentro de la superficie marcada.");
  const turns = s.corners.map((a, i) => { const b = s.corners[(i + 1) % 4]; const c = s.corners[(i + 2) % 4]; return b && c ? (b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x) : 0; });
  if (turns.some((v) => v <= 0.0001)) throw new Error("Las esquinas deben formar un rectángulo en perspectiva, sin cruzarse y en sentido horario.");
}

export function homography(from: Point[], to: Point[]) {
  const rows: number[][] = []; const values: number[] = [];
  from.forEach((p, i) => { const q = to[i]; if (!q) throw new Error("Referencia incompleta."); rows.push([p.x,p.y,1,0,0,0,-q.x*p.x,-q.x*p.y], [0,0,0,p.x,p.y,1,-q.y*p.x,-q.y*p.y]); values.push(q.x,q.y); });
  return [...solve(new Matrix(rows), Matrix.columnVector(values)).to1DArray(), 1];
}
export function project(h: number[], p: Point): Point {
  const v = (i: number) => h[i] ?? 0;
  const d = v(6)*p.x+v(7)*p.y+v(8);
  if (Math.abs(d) < 1e-9) throw new Error("Perspectiva no válida. Revisá las esquinas.");
  return { x:(v(0)*p.x+v(1)*p.y+v(2))/d, y:(v(3)*p.x+v(4)*p.y+v(5))/d };
}
export function signProjection(s: Surface, d: Dimensions) {
  validateSurface(s);
  const x = s.center.x*s.widthM-d.widthM/2, y = s.center.y*s.heightM-d.heightM/2;
  if (x < -1e-8 || y < -1e-8 || x+d.widthM > s.widthM+1e-8 || y+d.heightM > s.heightM+1e-8) throw new Error("El cartel no cabe en esa ubicación. Cambiá la posición o las medidas del cartel.");
  const plane = [{x:0,y:0},{x:s.widthM,y:0},{x:s.widthM,y:s.heightM},{x:0,y:s.heightM}];
  const h = homography(plane, s.corners);
  return [{x,y},{x:x+d.widthM,y},{x:x+d.widthM,y:y+d.heightM},{x,y:y+d.heightM}].map((p) => project(h,p));
}
export function fitLogo(w: number, h: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW/w,boxH/h);
  return { width:w*scale,height:h*scale,x:(boxW-w*scale)/2,y:(boxH-h*scale)/2 };
}
export type FacadeAnalysis = { found: boolean; zone: { x0: number; y0: number; x1: number; y1: number }; doorTopY: number | null; doorBottomY: number | null };
export const DOOR_HEIGHT_M = 2.1;
const DEFAULT_ZONE = { x0: 0.1, y0: 0.1, x1: 0.9, y1: 0.32 };
const DEFAULT_ZONE_WIDTH_M = 6;

/** Builds the installation surface from a validated facade analysis; falls back to a prudent upper band. */
export function placementFromAnalysis(a: FacadeAnalysis | null, imgW: number, imgH: number, signHeightM: number): { surface: Surface; estimated: boolean } {
  const ok = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
  const z = a?.zone;
  const zoneValid = !!a?.found && !!z && [z.x0, z.y0, z.x1, z.y1].every(ok) && z.x1 - z.x0 >= 0.15 && z.y1 > z.y0 && (z.y0 + z.y1) / 2 <= 0.6;
  const zone = zoneValid && z ? z : DEFAULT_ZONE;
  const door = a && ok(a.doorTopY) && ok(a.doorBottomY) && a.doorBottomY - a.doorTopY >= 0.15 ? (a.doorBottomY - a.doorTopY) * imgH : null;
  const pxPerM = zoneValid && door ? door / DOOR_HEIGHT_M : ((zone.x1 - zone.x0) * imgW) / DEFAULT_ZONE_WIDTH_M;
  const widthM = ((zone.x1 - zone.x0) * imgW) / pxPerM;
  let y0 = zone.y0, y1 = zone.y1;
  const needH = (signHeightM * pxPerM) / imgH;
  if (y1 - y0 < needH) { const c = (y0 + y1) / 2; y0 = Math.max(0, c - needH / 2); y1 = Math.min(1, y0 + needH); y0 = Math.max(0, y1 - needH); }
  const heightM = ((y1 - y0) * imgH) / pxPerM;
  return {
    estimated: !(zoneValid && door),
    surface: { corners: [{ x: zone.x0, y: y0 }, { x: zone.x1, y: y0 }, { x: zone.x1, y: y1 }, { x: zone.x0, y: y1 }], widthM, heightM: Math.max(heightM, signHeightM), measured: false, center: { x: 0.5, y: 0.5 } },
  };
}
