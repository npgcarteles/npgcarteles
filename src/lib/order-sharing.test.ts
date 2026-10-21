import { describe, expect, it } from "vitest";
import { instagramOrderUrl, orderSummary, whatsappOrderUrl } from "./order-sharing";

describe("manual order sharing", () => {
  it("addresses WhatsApp to the confirmed Argentina number", () => {
    const url = new URL(whatsappOrderUrl("Pedido NPG-000001\nLuz cálida"));
    expect(url.pathname).toBe("/5492975169780");
    expect(url.searchParams.get("text")).toBe("Pedido NPG-000001\nLuz cálida");
  });
  it("opens the requested Instagram account's chat", () => {
    expect(instagramOrderUrl).toBe("https://ig.me/m/npg_disenoycarteleria");
  });
  it("does not invent a price when the saved quote is pending", () => {
    const summary = orderSummary({ numeroFmt: "NPG-000001", config: { tipo: "Corpóreo LED", ancho: 3, alto: 0.6, iluminacion: "Luz blanca", colores: "", notas: "" }, contacto: { nombre: "Cliente", telefono: "123456789", email: "cliente@example.com" }, status: "esperando_presupuesto", total_ars: null }, "https://npgcarteles.lovable.app/pedidos/abc");
    expect(summary).toContain("Presupuesto: Pendiente de confirmación por NPG");
    expect(summary).not.toContain("$");
  });
});