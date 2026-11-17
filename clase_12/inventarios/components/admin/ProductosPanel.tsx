"use client";

import { useState } from "react";

import ProductoForm from "./ProductoForm";
import ProductosTable from "./ProductosTable";

export default function ProductosPanel() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="max-w-3xl rounded-xl border border-neutral-200 bg-white p-6">
        <ProductoForm onSuccess={() => setRefreshKey((key) => key + 1)} />
      </div>

      <div className="mt-8 max-w-5xl">
        <h2 className="mb-4 text-lg font-semibold">Productos registrados</h2>
        <ProductosTable
          refreshKey={refreshKey}
          onDeleted={() => setRefreshKey((key) => key + 1)}
        />
      </div>
    </>
  );
}
