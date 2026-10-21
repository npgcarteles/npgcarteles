import { useEffect, useRef, useState } from "react";
import { RotateCcw, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { signProjection, dimensions, type Point, type Surface } from "@/lib/montage-geometry";

const NAMES=["superior izquierda","superior derecha","inferior derecha","inferior izquierda"];
export function MontageCalibration({photo,value,onChange,widthM,heightM,disabled}:{photo:File;value:Surface;onChange:(s:Surface)=>void;widthM:number;heightM:number;disabled:boolean}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const [url,setUrl]=useState("");
  const [position,setPosition]=useState(false);
  useEffect(()=>{const u=URL.createObjectURL(photo);setUrl(u);return()=>URL.revokeObjectURL(u);},[photo]);
  useEffect(()=>{
    const c=ref.current;if(!c||!url)return;const ctx=c.getContext("2d");if(!ctx)return;
    const image=new Image();image.onload=()=>{
      c.width=image.naturalWidth;c.height=image.naturalHeight;ctx.drawImage(image,0,0);
      const css=getComputedStyle(c);ctx.strokeStyle=css.getPropertyValue("--neon").trim();ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=Math.max(2,c.width/350);
      function polygon(points:Point[]) {if(!ctx||!c)return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*c.width,p.y*c.height):ctx.moveTo(p.x*c.width,p.y*c.height));if(points.length===4)ctx.closePath();ctx.stroke();}
      polygon(value.corners);
      value.corners.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x*c.width,p.y*c.height,c.width/85,0,Math.PI*2);ctx.fill();ctx.font=`bold ${Math.max(14,c.width/45)}px sans-serif`;ctx.fillText(String(i+1),p.x*c.width+c.width/60,p.y*c.height);});
      try {ctx.setLineDash([c.width/90,c.width/120]);polygon(signProjection(value,dimensions(widthM,heightM)));}catch{}
    };image.src=url;
  },[url,value,widthM,heightM]);
  let issue="";if(value.corners.length===4)try{signProjection(value,dimensions(widthM,heightM));}catch(e){issue=e instanceof Error?e.message:"Referencia no válida";}
  return <section className="mt-6 border-t border-border pt-6" aria-label="Escala y ubicación">
    <h3 className="text-base">Escala y ubicación</h3>
    <p className="mt-2 text-sm text-muted-foreground">Marcá un sector rectangular de pared: {value.corners.length<4 ? `esquina ${NAMES[value.corners.length]}.` : "cuatro esquinas marcadas."} Las medidas deben corresponder a ese mismo sector.</p>
    <canvas ref={ref} aria-label="Marcar superficie en la foto" className="mt-4 block h-auto w-full cursor-crosshair rounded-lg border border-border" onClick={(e)=>{
      if(disabled)return;const r=e.currentTarget.getBoundingClientRect();const p={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
      if(value.corners.length<4){onChange({...value,corners:[...value.corners,p]});return;}
      if(position){import("@/lib/montage-geometry").then(({homography,project})=>{const h=homography(value.corners,[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]);onChange({...value,center:project(h,p)});});}
    }} />
    <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" disabled={disabled} onClick={()=>{setPosition(false);onChange({...value,corners:[],center:{x:0.5,y:0.5}});}}><RotateCcw /> Volver a marcar</Button><Button variant={position?"default":"outline"} disabled={disabled||value.corners.length!==4} onClick={()=>setPosition(!position)}><Crosshair /> {position?"Tocá el centro del cartel":"Cambiar ubicación"}</Button></div>
    <label className="mt-5 flex items-center gap-3 text-sm"><Checkbox checked={value.measured} disabled={disabled} onCheckedChange={(checked)=>onChange({...value,measured:checked===true})} /> Conozco las medidas reales del sector marcado</label>
    <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm">Ancho del sector (m)<Input type="number" aria-label="Ancho del sector" min="0.1" max="100" step="0.1" value={value.widthM} disabled={disabled} onChange={(e)=>onChange({...value,widthM:Number(e.target.value)})} /></label><label className="text-sm">Alto del sector (m)<Input type="number" aria-label="Alto del sector" min="0.1" max="100" step="0.1" value={value.heightM} disabled={disabled} onChange={(e)=>onChange({...value,heightM:Number(e.target.value)})} /></label></div>
    <p className="mt-3 text-xs text-muted-foreground">{value.measured?"Escala calibrada con medidas declaradas por vos; no equivale a una medición profesional.":"Vista ilustrativa: escala real no verificada. Las medidas del sector son aproximadas."}</p>
    {issue&&<p role="alert" className="mt-3 text-sm text-destructive">{issue}</p>}
  </section>;
}