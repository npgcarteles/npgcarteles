import { dimensions, fitLogo, homography, project, signProjection, type Surface } from "./montage-geometry";

async function load(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try { const image = new Image(); image.src = url; await image.decode(); return image; }
  finally { URL.revokeObjectURL(url); }
}
function canvas(w: number, h: number) { const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"); if (!ctx) throw new Error("Tu navegador no permite componer imágenes."); return {c,ctx}; }

// Deterministic composition: the original photo is never sent to a generative model.
export async function composeMontage(photo: Blob, logo: Blob, surface: Surface, widthM: number, heightM: number, warm: boolean) {
  const d = dimensions(widthM,heightM);
  const corners = signProjection(surface,d);
  const [bg, mark] = await Promise.all([load(photo),load(logo)]);
  const {c,ctx} = canvas(bg.naturalWidth,bg.naturalHeight);
  ctx.drawImage(bg,0,0);
  const lw = Math.min(1800,Math.max(600,Math.round(d.widthM*350))), lh = Math.round(lw/d.aspectRatio);
  const layer = canvas(lw,lh);
  const fitted = fitLogo(mark.naturalWidth,mark.naturalHeight,lw,lh);
  layer.ctx.drawImage(mark,fitted.x,fitted.y,fitted.width,fitted.height);
  const pixels = layer.ctx.getImageData(0,0,lw,lh);
  const target = corners.map((p) => ({x:p.x*c.width,y:p.y*c.height}));
  const inverse = homography(target,[{x:0,y:0},{x:lw,y:0},{x:lw,y:lh},{x:0,y:lh}]);
  const x0=Math.max(0,Math.floor(Math.min(...target.map((p)=>p.x)))), y0=Math.max(0,Math.floor(Math.min(...target.map((p)=>p.y))));
  const x1=Math.min(c.width,Math.ceil(Math.max(...target.map((p)=>p.x)))), y1=Math.min(c.height,Math.ceil(Math.max(...target.map((p)=>p.y))));
  const warped = canvas(Math.max(1,x1-x0),Math.max(1,y1-y0));
  const out = warped.ctx.createImageData(warped.c.width,warped.c.height);
  for(let y=0;y<warped.c.height;y++) for(let x=0;x<warped.c.width;x++) {
    const p=project(inverse,{x:x+x0+0.5,y:y+y0+0.5});
    if(p.x<0||p.y<0||p.x>=lw||p.y>=lh) continue;
    const src=(Math.floor(p.y)*lw+Math.floor(p.x))*4, dst=(y*warped.c.width+x)*4;
    for(let k=0;k<4;k++) out.data[dst+k]=pixels.data[src+k] ?? 0;
  }
  warped.ctx.putImageData(out,0,0);
  // Effects do not scale or redraw the source logo; only a bounded halo/contact shadow.
  const tokens=getComputedStyle(document.documentElement);
  const blur=Math.max(2,Math.min(12,(x1-x0)*0.02)), depth=Math.max(1,Math.round((y1-y0)*0.04));
  const margin=Math.ceil(blur*3+depth+4);
  const mask={x0:Math.max(0,x0-margin),y0:Math.max(0,y0-margin),x1:Math.min(c.width,x1+margin),y1:Math.min(c.height,y1+margin)};
  const original=ctx.getImageData(0,0,c.width,c.height);
  ctx.save(); ctx.beginPath(); ctx.rect(mask.x0,mask.y0,mask.x1-mask.x0,mask.y1-mask.y0); ctx.clip();
  // Contact shadow + letter depth (stacked darkened copies) + LED halo, all clipped to the sign mask.
  ctx.save(); ctx.filter="brightness(0.25)"; ctx.globalAlpha=0.35; ctx.shadowColor="rgba(0,0,0,0.6)"; ctx.shadowBlur=blur*0.6; ctx.shadowOffsetY=depth; ctx.drawImage(warped.c,x0+depth*0.5,y0+depth); ctx.restore();
  ctx.save(); ctx.filter="brightness(0.55)"; for(let i=depth;i>0;i--) ctx.drawImage(warped.c,x0+i*0.3,y0+i*0.6); ctx.restore();
  ctx.save(); ctx.shadowColor=tokens.getPropertyValue(warm ? "--sign-halo-warm" : "--sign-halo-white").trim(); ctx.shadowBlur=blur; ctx.drawImage(warped.c,x0,y0); ctx.restore();
  ctx.drawImage(warped.c,x0,y0);
  ctx.restore();
  if(!verifyUntouched(original,ctx.getImageData(0,0,c.width,c.height),mask)) throw new Error("La simulación modificó zonas de la foto fuera del cartel. Probá de nuevo.");
  const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob((b)=>b?resolve(b):reject(new Error("No se pudo exportar el montaje.")),"image/png"));
  return {blob,corners,dimensions:d,mask,face:{canvas:warped.c,x:x0,y:y0}};
}
/** True when every pixel outside the mask is identical to the original photo. */
export function verifyUntouched(a: ImageData, b: ImageData, m: {x0:number;y0:number;x1:number;y1:number}) {
  if (a.width!==b.width||a.height!==b.height) return false;
  for (let y=0;y<a.height;y++) for (let x=0;x<a.width;x++) {
    if (x>=m.x0&&x<m.x1&&y>=m.y0&&y<m.y1) continue;
    const i=(y*a.width+x)*4;
    if (a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2]||a.data[i+3]!==b.data[i+3]) return false;
  }
  return true;
}
