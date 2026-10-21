import { describe, it, expect } from "vitest";
import { dimensions, fitLogo, signProjection, homography, project, type Surface } from "./montage-geometry";
const surface: Surface={corners:[{x:0.1,y:0.2},{x:0.9,y:0.2},{x:0.9,y:0.8},{x:0.1,y:0.8}],widthM:6,heightM:2,measured:true,center:{x:0.5,y:0.5}};
describe("escala física",()=>{
  for(const w of [1,2,3,5]) it(`${w} m mantiene su proyección física en la misma fachada`,()=>{
    const p=signProjection(surface,dimensions(w,0.6));
    expect((p[1]?.x ?? 0)-(p[0]?.x ?? 0)).toBeCloseTo(0.8*w/6,8);
    expect((p[2]?.y ?? 0)-(p[1]?.y ?? 0)).toBeCloseTo(0.6*0.6/2,8);
  });
  it("2 m no ocupa el espacio de 5 m",()=>{ const width=(w:number)=>{const p=signProjection(surface,dimensions(w,0.6));return (p[1]?.x??0)-(p[0]?.x??0);}; expect(width(2)/width(5)).toBeCloseTo(0.4,8); });
  it("no estira el logo cuadrado para llenar el cartel",()=>{const f=fitLogo(200,200,1000,300);expect(f).toEqual({width:300,height:300,x:350,y:0});});
  it("rechaza superficie insuficiente",()=>expect(()=>signProjection({...surface,widthM:1},dimensions(2,0.6))).toThrow("no cabe"));
  it("rechaza posición que sale de la pared",()=>expect(()=>signProjection({...surface,center:{x:0.98,y:0.5}},dimensions(2,0.6))).toThrow("no cabe"));
  it("rechaza esquinas cruzadas",()=>expect(()=>signProjection({...surface,corners:[surface.corners[0],surface.corners[2],surface.corners[1],surface.corners[3]].filter((p)=>p!==undefined)},dimensions(2,0.6))).toThrow("sin cruzarse"));
  it("las medidas normalizadas conservan la selección",()=>expect(dimensions(2,0.6)).toEqual({widthM:2,heightM:0.6,aspectRatio:2/0.6,source:"customer_selection"}));
  it("respeta 2 × 0.6 m también con perspectiva",()=>{
    const s={...surface,corners:[{x:0.2,y:0.2},{x:0.8,y:0.3},{x:0.9,y:0.7},{x:0.1,y:0.8}]};
    const pts=signProjection(s,dimensions(2,0.6));
    const inv=homography(s.corners,[{x:0,y:0},{x:6,y:0},{x:6,y:2},{x:0,y:2}]);
    const plane=pts.map((p)=>project(inv,p));
    expect((plane[1]?.x??0)-(plane[0]?.x??0)).toBeCloseTo(2,8);
    expect((plane[2]?.y??0)-(plane[1]?.y??0)).toBeCloseTo(0.6,8);
  });
  it("una referencia aproximada nunca se convierte en medida verificada",()=>{const s={...surface,measured:false};signProjection(s,dimensions(2,0.6));expect(s.measured).toBe(false);});
});