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
    "Image 1 is a photo of a real storefront. Image 2 is the business logo.",
    "Images 3 and 4 are completed NPG signs: use them ONLY as references for substantial sign presence, manufactured dimensional letters, professional placement and beautiful LED illumination. Never copy their business names, logos or buildings.",
    `Photorealistically install a new, real, physically built exterior sign on the storefront facade. Construction style: ${ESTILO[c.tipo] ?? c.tipo}. Customer's ordered size: ${c.tamano}. This is an aesthetic visualization, not a measured scale drawing. Prioritize the prominent, substantial visual size seen in the NPG reference works instead of door-based meter calibration.`,
    "Place the complete logo prominently in the main signage band above the shop entrance, centered and aligned with the facade perspective. Make it large and easily readable, occupying most of the usable signage area with modest margins, not a tiny logo floating in a wide empty rectangle. Fit the entire logo without distorting, cropping or separating its elements. If an old sign occupies that band, replace its lettering with the customer's logo, rather than overlaying two brands. Never place the sign on the door, shutter, pavement or sky.",
    "Make it look like a professionally manufactured and installed sign: real materials, visible thickness/depth, mounting hardware, edges, accurate perspective, contact shadows on the wall, and light falloff consistent with the scene. It must not look pasted or flat.",
    `Reproduce the logo from image 2 faithfully (same shapes, text and proportions) as the sign content. Colors: ${c.colores || "the logo's original colors"}.`,
    `Lighting: backlit sign with ${c.iluminacion === "Luz blanca" ? "cool white (about 6000K)" : "warm white (about 3000K)"} LEDs, clearly visible glowing halo behind the letters like the completed NPG reference signs. Retain the original photo's time of day and exposure; match perspective, shadows, reflections and materials realistically.`,
    c.notas ? `Extra notes: ${c.notas}.` : "",
    "The sign must show ONLY the logo from image 2 and nothing else: do NOT write the sign type, product name, size, dividers or any added words or slogans on the sign. Keep the rest of the photo (building, street, people, sky) unchanged. No watermarks or extra text anywhere.",
  ].join(" ");
}
