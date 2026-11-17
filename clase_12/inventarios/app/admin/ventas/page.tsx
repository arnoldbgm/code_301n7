import VentasPanel from "@/components/admin/VentasPanel";

export default function VentasPage() {
  return (
    <section className="flex-1 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <p className="text-sm text-neutral-500">
          Emite boletas y facturas (listas para enviarse a SUNAT vía Nubefact).
        </p>
      </header>

      <VentasPanel />
    </section>
  );
}
