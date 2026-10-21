export type SignConfig = {
  tipo: string;
  tamano: string;
  colores: string;
  iluminacion: string;
  notas: string;
};

export const TIPOS = [
  { id: "Corpóreo LED", desc: "Letras 3D iluminadas con LED" },
  { id: "Black Night", desc: "Frente negro que se ilumina de noche" },
  { id: "Cartelería en Polyfan", desc: "Panel liviano y resistente" },
  { id: "Vinilos", desc: "Vinilo adhesivo sobre vidriera o pared" },
  { id: "Impresión LED", desc: "Caja de luz con impresión retroiluminada" },
];
export const TAMANOS = ["Chico (1 m)", "Mediano (2 m)", "Grande (3 m)", "Extra grande (4 m+)"];
export const ILUMINACION = ["Retroiluminado blanco cálido"];

const ESTILO: Record<string, string> = {
  "Corpóreo LED": "dimensional 3D channel letters with built-in LED lighting",
  "Black Night": "black acrylic panel that looks black by day and glows through the logo at night",
  "Cartelería en Polyfan": "lightweight flat polyfan (aluminum composite) panel sign",
  "Vinilos": "adhesive vinyl applied directly on the glass or wall",
  "Impresión LED": "backlit lightbox with the logo printed on its face",
};

export function buildPrompt(c: SignConfig) {
  return [
    "Image 1 is a photo of a real storefront. Image 2 is the business logo.",
    `Photorealistically install a new, real, physically built exterior sign on the storefront facade. Construction style: ${ESTILO[c.tipo] ?? c.tipo}. Exact sign dimensions: ${c.tamano}. Estimate the real-world scale from the door (about 2.1 m tall) and other facade elements, and size the sign to exactly those measurements, keeping its width-to-height proportion.`,
    "Make it look like a professionally manufactured and installed sign: real materials, visible thickness/depth, mounting hardware, edges, accurate perspective, contact shadows on the wall, and light falloff consistent with the scene. It must not look pasted or flat.",
    `Reproduce the logo from image 2 faithfully (same shapes, text and proportions) as the sign content. Colors: ${c.colores || "the logo's original colors"}.`,
    `Lighting: backlit sign with warm white (about 3000K) LEDs, glowing halo behind the letters, shown at dusk with the sign turned on. Match perspective, scale, shadows, reflections and materials realistically.`,
    c.notas ? `Extra notes: ${c.notas}.` : "",
    "The sign must show ONLY the logo from image 2 and nothing else: do NOT write the sign type, product name, size, dividers or any added words or slogans on the sign. Keep the rest of the photo (building, street, people, sky) unchanged. No watermarks or extra text anywhere.",
  ].join(" ");
}
