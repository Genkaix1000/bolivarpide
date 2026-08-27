import { listProducts } from "@/lib/business/queries";
import { deleteProduct, upsertProduct } from "@/lib/business/actions";

export default async function CartaPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const products = await listProducts(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Carta</h1>
        <p className="text-sm text-stone-600">CRUD real sobre `products` (price en pesos → `price_cents`).</p>
      </div>

      <form
        action={upsertProduct}
        className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-4"
      >
        <input type="hidden" name="businessId" value={businessId} />
        <input
          name="name"
          required
          placeholder="Nombre"
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="category"
          placeholder="Categoría"
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Precio $"
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="available" defaultChecked />
          Disponible
        </label>
        <button
          type="submit"
          className="md:col-span-4 rounded-full bg-[#9a0002] px-4 py-2 text-sm font-semibold text-white cursor-pointer"
        >
          Agregar producto
        </button>
      </form>

      <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {products.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-stone-500">Sin productos aún.</li>
        ) : (
          products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium text-stone-900">{p.name}</p>
                <p className="text-xs text-stone-500">
                  {p.category ?? "—"} · ${(p.price_cents / 100).toLocaleString("es-AR")}
                  {p.available ? "" : " · no disponible"}
                </p>
              </div>
              <form action={deleteProduct}>
                <input type="hidden" name="businessId" value={businessId} />
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="rounded-full border border-stone-300 px-3 py-1 text-xs cursor-pointer"
                >
                  Borrar
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
