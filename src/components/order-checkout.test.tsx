import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderCheckout } from "./order-checkout";

afterEach(cleanup);

const selected = { kind: "total" as const, amount: 520000, label: "Pagar total", pendiente: 0 };
const defaults = { total: 520000, paid: 0, options: [selected], selected, isOwner: true, busy: false, error: null, quoteNote: null, onKind: vi.fn() };

describe("pago NPG", () => {
  it("seleccionar Mercado Pago inicia el pago real mediante la acción recibida", () => {
    const pay = vi.fn();
    render(<OrderCheckout {...defaults} onPay={pay} />);
    fireEvent.click(screen.getByRole("radio", { name: "MERCADO PAGO" }));
    expect(pay).toHaveBeenCalledTimes(1);
  });
  it("sin confirmación no permite iniciar el pago", () => {
    const pay = vi.fn();
    render(<OrderCheckout {...defaults} options={[]} selected={undefined} onPay={pay} />);
    fireEvent.click(screen.getByRole("radio", { name: "MERCADO PAGO" }));
    expect(pay).not.toHaveBeenCalled();
  });
  it("un usuario que no es dueño no puede iniciar el pago", () => {
    const pay = vi.fn();
    render(<OrderCheckout {...defaults} isOwner={false} onPay={pay} />);
    fireEvent.click(screen.getByRole("radio", { name: "MERCADO PAGO" }));
    expect(pay).not.toHaveBeenCalled();
  });
});