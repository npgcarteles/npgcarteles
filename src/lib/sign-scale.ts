import { dimensions, signProjection, type Point, type Surface } from "./montage-geometry";

export const REFERENCE_DOOR_METERS = 2;
export type ScaleAnalysis = {
  found: boolean; doorComplete: boolean; samePlane: boolean; frontal: boolean;
  zone: { x0: number; y0: number; x1: number; y1: number };
  doorTopY: number | null; doorBottomY: number | null;
};

/** Only frontal, coplanar photographs support this metric calibration. Never infer hidden geometry. */
export function calibratedPlacement(a: ScaleAnalysis, width: number, height: number, widthM: number, heightM: number): { surface: Surface; corners: Point[]; pixelsPerMeter: number } {
  if (!a.doorComplete || !a.samePlane || !a.frontal || a.doorTopY === null || a.doorBottomY === null)
    throw new Error("Subí una foto frontal con la puerta de entrada completa, desde el piso hasta el marco superior, en el mismo plano que el cartel. Si la puerta está retraída o la foto tiene perspectiva, necesitamos una medida adicional; no podemos confirmar la escala con esta foto.");
  const z = a.zone;
  if (!a.found || ![z.x0,z.y0,z.x1,z.y1,a.doorTopY,a.doorBottomY].every(v => Number.isFinite(v) && v >= 0 && v <= 1) || a.doorBottomY <= a.doorTopY || z.x1 <= z.x0 || z.y1 <= z.y0 || z.y1 > a.doorTopY)
    throw new Error("No encontramos una franja de fachada válida sobre la entrada. Subí otra foto frontal.");
  const pixelsPerMeter = (a.doorBottomY - a.doorTopY) * height / REFERENCE_DOOR_METERS;
  const surface: Surface = {
    corners: [{x:z.x0,y:z.y0},{x:z.x1,y:z.y0},{x:z.x1,y:z.y1},{x:z.x0,y:z.y1}],
    widthM: (z.x1-z.x0)*width/pixelsPerMeter,
    heightM: (z.y1-z.y0)*height/pixelsPerMeter,
    measured:false, center:{x:0.5,y:0.5},
  };
  try { return { surface, pixelsPerMeter, corners: signProjection(surface, dimensions(widthM,heightM)) }; }
  catch { throw new Error("El cartel no cabe en la franja disponible con la medida elegida. Elegí otra medida o consultá a NPG; no vamos a reducirlo para hacerlo entrar."); }
}