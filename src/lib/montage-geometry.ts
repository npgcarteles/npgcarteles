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