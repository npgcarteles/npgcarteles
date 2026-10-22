"use client";
import { useState } from "react";

type Props = {
  isOwner: boolean;
  total: number | null;
  selected?: any;
  busy?: boolean;
  onPay: () => void;
};

export default function OrderCheckout({ isOwner, total, selected, busy, onPay }: Props) {
  const canPay = isOwner && total != null && total > 0 && !busy;
  const amount = total ?? selected?.total ?? 0;

  return (
    <div className="w-full space-y-4">
      {total !== null && total !== undefined && (
        <div className="text-lg font-bold">
          Pagás ahora: ${amount}
        </div>
      )}
      <button
        disabled={!canPay}
        onClick={() => onPay()}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg text-lg"
      >
        {busy ? "Procesando..." : "MERCADO PAGO"}
      </button>
    </div>
  );
}