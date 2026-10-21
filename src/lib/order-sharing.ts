import { formatARS, STATUS_LABEL, type Contacto, type OrderConfig, type OrderStatus } from "@/lib/orders.shared";

export const ORDER_WHATSAPP = "5492975169780";
export const ORDER_INSTAGRAM = "npg_disenoycarteleria";
export const instagramOrderUrl = `https://ig.me/m/${ORDER_INSTAGRAM}`;

export function orderSummary(order: { numeroFmt: string; config: OrderConfig; contacto: Contacto; status: OrderStatus; total_ars: number | null }, orderUrl: string) {
  const { config, contacto } = order;
  return [
    `Hola NPG, quiero consultar por mi pedido ${order.numeroFmt}.`,
    `Cartel: ${config.tipo}`,
    `Medidas: ${config.ancho} m × ${config.alto} m`,
    `Iluminación: ${config.iluminacion}`,
    `Cliente: ${contacto.nombre}`,
    `Teléfono: ${contacto.telefono}`,
    `Email: ${contacto.email}`,
    ...(contacto.ciudad ? [`Ciudad: ${contacto.ciudad}`] : []),
    `Estado: ${STATUS_LABEL[order.status]}`,
    `Presupuesto: ${order.total_ars == null ? "Pendiente de confirmación por NPG" : formatARS(order.total_ars)}`,
    `Pedido: ${orderUrl}`,
  ].join("\n");
}

export function whatsappOrderUrl(summary: string) {
  return `https://wa.me/${ORDER_WHATSAPP}?text=${encodeURIComponent(summary)}`;
}