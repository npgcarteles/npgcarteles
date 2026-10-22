import { describe, expect, it } from "vitest";
import { calibratedPlacement, REFERENCE_DOOR_METERS, type ScaleAnalysis } from "./sign-scale";
const a: ScaleAnalysis = { found:true, doorComplete:true, samePlane:true, frontal:true, doorTopY:0.4, doorBottomY:0.6, zone:{x0:0.1,y0:0.1,x1:0.9,y1:0.35} };
describe("referencia de puerta de 2 metros", () => {
  it("puerta de 200 píxeles y cartel de 4 metros dan 400 píxeles", () => {
    const r=calibratedPlacement(a,1000,1000,4,0.8);
    expect(REFERENCE_DOOR_METERS).toBe(2);
    expect(r.pixelsPerMeter).toBeCloseTo(100);
    expect(((r.corners[1]?.x ?? 0)-(r.corners[0]?.x ?? 0))*1000).toBeCloseTo(400);
    expect(((r.corners[2]?.y ?? 0)-(r.corners[1]?.y ?? 0))*1000).toBeCloseTo(80);
  });
  for(const key of ["doorComplete","samePlane","frontal"] as const) it(`rechaza ${key} insuficiente`,()=>expect(()=>calibratedPlacement({...a,[key]:false},1000,1000,4,0.8)).toThrow("foto frontal"));
  it("no reduce un cartel de 5 metros para que entre en 3 metros",()=>expect(()=>calibratedPlacement({...a,zone:{...a.zone,x0:0.35,x1:0.65}},1000,1000,5,1)).toThrow("no cabe"));
  it("no agranda una franja demasiado baja",()=>expect(()=>calibratedPlacement({...a,zone:{...a.zone,y1:0.15}},1000,1000,4,0.8)).toThrow("no cabe"));
  it("no permite cartel sobre la puerta",()=>expect(()=>calibratedPlacement({...a,zone:{...a.zone,y1:0.5}},1000,1000,4,0.8)).toThrow("franja"));
});