import ClientesPanel from "@/components/admin/ClientesPanel";

export default function ClientesPage() {
  return (
    <section className="flex-1 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-neutral-500">Registra un nuevo cliente.</p>
      </header>

      <ClientesPanel />
    </section>
  );
}
