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
  ctx.save(); ctx.shadowColor=warm ? "rgba(255,210,140,0.65)" : "rgba(235,245,255,0.65)"; ctx.shadowBlur=Math.max(2,Math.min(12,(x1-x0)*0.02)); ctx.drawImage(warped.c,x0,y0); ctx.restore();
  ctx.drawImage(warped.c,x0,y0);
  const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob((b)=>b?resolve(b):reject(new Error("No se pudo exportar el montaje.")),"image/png"));
  return {blob,corners,dimensions:d};
}