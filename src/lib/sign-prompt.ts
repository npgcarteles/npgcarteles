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
export const ILUMINACION = ["Día, sin luz", "Luz frontal", "Retroiluminado (halo)", "Escena nocturna encendido"];

export function buildPrompt(c: SignConfig) {
  return [
    "Image 1 is a photo of a real storefront. Image 2 is the business logo.",
    `Photorealistically install a new exterior sign on the storefront facade: type "${c.tipo}", approximate width ${c.tamano}.`,
    `Reproduce the logo from image 2 faithfully (same shapes, text and proportions) as the sign content. Colors: ${c.colores || "the logo's original colors"}.`,
    `Lighting: ${c.iluminacion}. Match perspective, scale, shadows, reflections and materials realistically.`,
    c.notas ? `Extra notes: ${c.notas}.` : "",
    "Keep the rest of the photo (building, street, people, sky) unchanged. No watermarks or extra text.",
  ].join(" ");
}
