import { describe, expect, it } from "vitest";
import { calcAutoQuote, deriveOrderStatus, paymentOptions } from "./orders.shared";

describe("presupuesto", () => {
  it("sin precios configurados queda en modo manual", () => {
    expect(calcAutoQuote({ ancho: 3, alto: 0.8 }, { auto_enabled: false, price_per_m2_ars: 100000, installation_ars: null, deposit_percent: null })).toBeNull();
    expect(calcAutoQuote({ ancho: 3, alto: 0.8 }, { auto_enabled: true, price_per_m2_ars: null, installation_ars: null, deposit_percent: null })).toBeNull();
  });
  it("modo automático usa m² + instalación y seña %", () => {
    expect(calcAutoQuote({ ancho: 3, alto: 0.8 }, { auto_enabled: true, price_per_m2_ars: 100000, installation_ars: 50000, deposit_percent: 30 }))
      .toEqual({ total: 290000, deposit: 87000 });
  });
});

describe("modalidades de pago", () => {
  it("sin seña configurada solo ofrece pago total", () => {
    expect(paymentOptions(1000, null, 0).map((o) => o.kind)).toEqual(["total"]);
  });
  it("con seña ofrece total y seña con saldo", () => {
    const o = paymentOptions(1000, 300, 0);
    expect(o.map((x) => x.kind)).toEqual(["total", "sena"]);
    expect(o[1]!.pendiente).toBe(700);
  });
  it("después de la seña solo queda el saldo", () => {
    expect(paymentOptions(1000, 300, 300)).toEqual([{ kind: "saldo", amount: 700, label: "Pagar saldo pendiente", pendiente: 0 }]);
  });
  it("sin presupuesto no hay pago", () => expect(paymentOptions(null, null, 0)).toEqual([]));
});

describe("estado del pedido", () => {
  it("un pago aprobado verificado aprueba el pedido", () => {
    expect(deriveOrderStatus("pendiente_pago", [{ status: "rejected", created_at: "1" }, { status: "approved", created_at: "2" }])).toBe("pago_aprobado");
  });
  it("rechazado sin aprobados queda rechazado", () => {
    expect(deriveOrderStatus("pendiente_pago", [{ status: "rejected", created_at: "1" }])).toBe("pago_rechazado");
  });
  it("no retrocede un pedido en fabricación", () => {
    expect(deriveOrderStatus("en_fabricacion", [{ status: "rejected", created_at: "1" }])).toBe("en_fabricacion");
  });
});
