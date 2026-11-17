import ProductosPanel from "@/components/admin/ProductosPanel";

export default function ProductosPage() {
  return (
    <section className="flex-1 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-neutral-500">
          Registra y administra el inventario con precios que incluyen IGV.
        </p>
      </header>

      <ProductosPanel />
    </section>
  );
}
