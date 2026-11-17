"use client";

import { useState } from "react";

import ClienteForm from "./ClienteForm";
import ClientesTable from "./ClientesTable";

export default function ClientesPanel() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="max-w-3xl rounded-xl border border-neutral-200 bg-white p-6">
        <ClienteForm onSuccess={() => setRefreshKey((key) => key + 1)} />
      </div>

      <div className="mt-8 max-w-5xl">
        <h2 className="mb-4 text-lg font-semibold">Clientes registrados</h2>
        <ClientesTable
          refreshKey={refreshKey}
          onDeleted={() => setRefreshKey((key) => key + 1)}
        />
      </div>
    </>
  );
}
