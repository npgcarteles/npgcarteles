export type SignConfig = {
  tipo: string;
  tamano: string;
  colores: string;
  iluminacion: string;
  notas: string;
};

export const TIPOS = [
  { id: "Corpóreo LED", desc: "Letras 3D iluminadas con LED" },
];
export const PERSONALIZADOS = [
  { id: "Carteles Backlight LED", desc: "Caja de luz retroiluminada con LED" },
  { id: "Carteles Front", desc: "Cartel frontal para fachadas de locales" },
  { id: "Rotulaciones", desc: "Rotulación de vehículos, paredes y superficies" },
];
export const TAMANOS = ["Chico (1 m)", "Mediano (2 m)", "Grande (3 m)", "Extra grande (4 m+)"];
export const ILUMINACION = ["Luz blanca", "Luz cálida"];

const ESTILO: Record<string, string> = {
  "Corpóreo LED": "premium dimensional 3D channel letters (about 5-8 cm deep) with metal or acrylic returns, opal acrylic faces, internal LED modules and standoff mounting a few cm off the wall, crisp clean edges",
  "Black Night": "black acrylic panel that looks black by day and glows through the logo at night",
  "Cartelería en Polyfan": "lightweight flat polyfan (aluminum composite) panel sign",
  "Vinilos": "adhesive vinyl applied directly on the glass or wall",
  "Impresión LED": "backlit lightbox with the logo printed on its face",
};

export function buildPrompt(c: SignConfig) {
  return [
    "Image 1 is a storefront with the customer's logo already projected at its calibrated position. Image 2 is the original logo. Images 3 and 4 are material and lighting references ONLY: never borrow their logos, size or buildings.",
    `Enhance only materials and lighting of the preplaced Corpóreo LED. Construction style: ${ESTILO[c.tipo] ?? c.tipo}. Total ordered envelope: ${c.tamano}, not each individual letter. The complete main door including frame is assumed exactly 2 meters from floor to upper frame; the geometry was computed BEFORE this edit. For a frontal coplanar door 200 pixels high, 4 meters spans 400 pixels. Never enlarge for aesthetics or shrink to fit.`,
    "Keep the exact existing preplaced logo footprint and perspective. Preserve original aspect ratio, all elements and text without stretching. The placement is centered on the existing wall signage band above the entrance. Never move it onto doors, windows, shutters or outside the facade. Remove previous branding within the editable band without superimposing brands. Outside the supplied mask keep architecture, framing and exposure unchanged.",
    "Make it look like a professionally manufactured and installed sign: real materials, visible thickness/depth, mounting hardware, edges, accurate perspective, contact shadows on the wall, and light falloff consistent with the scene. It must not look pasted or flat.",
    `Reproduce the logo from image 2 faithfully (same shapes, text and proportions) as the sign content. Colors: ${c.colores || "the logo's original colors"}.`,
    `Lighting: backlit sign with ${c.iluminacion === "Luz blanca" ? "cool white (about 6000K)" : "warm white (about 3000K)"} LEDs, clearly visible glowing halo behind the letters like the completed NPG reference signs. Retain the original photo's time of day and exposure; match perspective, shadows, reflections and materials realistically.`,
    c.notas ? `Extra notes: ${c.notas}.` : "",
    "The sign must show ONLY the logo from image 2 and nothing else: do NOT write the sign type, product name, size, dividers or any added words or slogans on the sign. Keep the rest of the photo (building, street, people, sky) unchanged. No watermarks or extra text anywhere.",
  ].join(" ");
}
