"use client";

import { useState } from "react";

import VentaForm from "./VentaForm";
import VentasTable from "./VentasTable";

export default function VentasPanel() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="max-w-3xl rounded-xl border border-neutral-200 bg-white p-6">
        <VentaForm onSuccess={() => setRefreshKey((key) => key + 1)} />
      </div>

      <div className="mt-8 max-w-5xl">
        <h2 className="mb-4 text-lg font-semibold">Ventas registradas</h2>
        <VentasTable refreshKey={refreshKey} />
      </div>
    </>
  );
}
