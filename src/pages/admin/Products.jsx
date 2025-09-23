import { useEffect, useMemo, useState } from "react";
import ProductForm from "../../components/admin/ProductForm";
import {
  createProduct,
  updateProduct,
  deleteProductById,
  subscribeProducts,
} from "../../services/products";
import { LoadingOverlay } from "../../components/ui/LoadingIndicators";

const statusStyles = {
  true: "border border-emerald-200 bg-emerald-50 text-emerald-600",
  false: "border border-slate-200 bg-slate-100 text-slate-500",
};

function money(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default function Products() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState("all");
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProducts(
      { q: "", onlyActive: "all", category: "all", pageSize: 50 },
      (items) => {
        setRows(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const nq = (q || "").trim().toLowerCase();
    return rows.filter((p) => {
      const text = !nq || (p.nameLower || "").includes(nq);
      const st = onlyActive === "all" ? true : !!p.active === (onlyActive === "true");
      const cat = category === "all" ? true : p.category === category;
      return text && st && cat;
    });
  }, [rows, q, onlyActive, category]);

  async function handleCreate(payload) {
    setLoading(true);
    await createProduct(payload);
    setLoading(false);
    setModalOpen(false);
  }

  async function handleUpdate(payload) {
    setLoading(true);
    await updateProduct(editing.id, payload);
    setLoading(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    setLoading(true);
    await deleteProductById(id);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_80px_-50px_rgba(15,23,42,0.2)]">
        <div className="absolute -right-28 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              Inventario vivo
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Productos</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-500">
                Administrá catálogo y stock con feedback inmediato y animaciones suaves durante las operaciones.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition hover:-translate-y-0.5"
          >
            Nuevo producto
          </button>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_65px_-45px_rgba(15,23,42,0.18)]">
        <div className="grid gap-4 md:grid-cols-4">
          <input
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Buscar por nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            value={onlyActive}
            onChange={(e) => setOnlyActive(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            <option value="general">General</option>
            <option value="montaña">Montaña</option>
            <option value="ruta">Ruta</option>
            <option value="urbana">Urbana</option>
            <option value="accesorios">Accesorios</option>
          </select>
          <div className="flex items-center justify-end text-sm text-slate-500">
            {loading ? "Cargando…" : `${filtered.length} resultados`}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_70px_-45px_rgba(15,23,42,0.18)]">
        {loading && (
          <LoadingOverlay
            label="Sincronizando productos…"
            className="rounded-[inherit] border border-slate-200 bg-white text-slate-600"
            labelClassName="text-slate-600"
          />
        )}
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 capitalize text-slate-500">{p.category || "general"}</td>
                <td className="px-4 py-4 text-right font-semibold text-slate-900">{money(p.price)}</td>
                <td className="px-4 py-4 text-right text-slate-500">{p.stock ?? 0}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${statusStyles[p.active]}`}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
                      onClick={() => setEditing(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-rose-400 hover:text-slate-900"
                      onClick={() => handleDelete(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={6}>
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductForm open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      <ProductForm open={!!editing} initial={editing} onClose={() => setEditing(null)} onSubmit={handleUpdate} />
    </div>
  );
}
