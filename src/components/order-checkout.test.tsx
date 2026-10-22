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
  it("con total 720000 el pago se habilita aunque no sea dueño", () => {
    const pay = vi.fn();
    const o = { ...selected, amount: 720000 };
    render(<OrderCheckout {...defaults} total={720000} options={[o]} selected={o} isOwner={false} onPay={pay} />);
    fireEvent.click(screen.getByRole("radio", { name: "MERCADO PAGO" }));
    expect(pay).toHaveBeenCalledTimes(1);
  });
  it("sin total no permite pagar", () => {
    const pay = vi.fn();
    render(<OrderCheckout {...defaults} total={null} onPay={pay} />);
    fireEvent.click(screen.getByRole("radio", { name: "MERCADO PAGO" }));
    expect(pay).not.toHaveBeenCalled();
  });
});