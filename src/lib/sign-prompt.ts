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
    "Image 1 is the customer's original storefront photo. Image 2 is the customer's logo. Images 3 and 4 are NPG material and lighting references ONLY: never borrow their logos or buildings.",
    `Create a photorealistic installed Corpóreo LED from image 2. Construction style: ${ESTILO[c.tipo] ?? c.tipo}. Commercial ordered dimensions: ${c.tamano}. This is an illustrative visualization, not a calibrated scale drawing. Do not infer physical measurements from architectural elements.`,
    "First identify the actual available wall signage band on this business facade. Place the complete logo centered within that band, with balanced margins and a legible, substantial presence appropriate to the building. Align the sign baseline and depth with the facade's actual perspective, including oblique photographs. Preserve the logo's original aspect ratio, shapes and all elements without stretching or cropping. Keep the entire sign within the wall band; never on glass, entrances, shutters, roof, sky or pavement. If an existing sign is present, replace its branding cleanly rather than superimposing two brands. Do not assume any architectural element has a standard height.",
    "Make it look like a professionally manufactured and installed sign: real materials, visible thickness/depth, mounting hardware, edges, accurate perspective, contact shadows on the wall, and light falloff consistent with the scene. It must not look pasted or flat.",
    `Reproduce the original logo faithfully as the sign's ONLY content. Colors: ${c.colores || "the logo's original colors"}.`,
    `Lighting: backlit sign with ${c.iluminacion === "Luz blanca" ? "cool white (about 6000K)" : "warm white (about 3000K)"} LEDs, clearly visible glowing halo behind the letters like the completed NPG reference signs. Retain the original photo's time of day and exposure; match perspective, shadows, reflections and materials realistically.`,
    c.notas ? `Extra notes: ${c.notas}.` : "",
    "Output the complete storefront photograph with a single finished sign integrated onto the facade. Keep the original architecture, framing, camera angle and scene intact. No duplicate logos, added product names, measurements, slogans, dividers, watermarks or extra text. The sign must display ONLY the customer's logo.",
  ].join(" ");
}
