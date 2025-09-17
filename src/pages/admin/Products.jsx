import { useEffect, useMemo, useState } from "react";
import ProductForm from "../../components/admin/ProductForm";
import {
  listProducts, createProduct, updateProduct, deleteProductById
} from "../../services/products";

function money(n){ return Number(n||0).toLocaleString("es-AR",{style:"currency",currency:"ARS"}); }

export default function Products(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState("all");
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // carga inicial
  useEffect(() => { (async ()=>{
    setLoading(true);
    const { items } = await listProducts({ q: "", onlyActive: "all", category: "all", pageSize: 50 });
    setRows(items);
    setLoading(false);
  })(); }, []);

  // filtro rápido en cliente (además del server-side en listProducts si usás q/onlyActive/category)
  const filtered = useMemo(()=>{
    const nq = (q||"").trim().toLowerCase();
    return rows.filter(p=>{
      const text = !nq || (p.nameLower||"").includes(nq);
      const st   = onlyActive==="all" ? true : !!p.active === (onlyActive==="true");
      const cat  = category==="all" ? true : (p.category===category);
      return text && st && cat;
    });
  }, [rows, q, onlyActive, category]);

  async function handleCreate(payload){
    setLoading(true);
    await createProduct(payload);
    // refresco rápido
    const { items } = await listProducts({ q: "", onlyActive: "all", category: "all", pageSize: 50 });
    setRows(items);
    setLoading(false);
    setModalOpen(false);
  }

  async function handleUpdate(payload){
    setLoading(true);
    await updateProduct(editing.id, payload);
    const { items } = await listProducts({ q: "", onlyActive: "all", category: "all", pageSize: 50 });
    setRows(items);
    setLoading(false);
    setEditing(null);
  }

  async function handleDelete(id){
    if (!confirm("¿Eliminar este producto?")) return;
    setLoading(true);
    await deleteProductById(id);
    setRows(prev => prev.filter(p => p.id !== id));
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-slate-600">Catálogo y stock (Firestore + Storage).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={()=>setModalOpen(true)}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
          >
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Buscar por nombre…"
                 value={q} onChange={e=>setQ(e.target.value)} />
          <select className="rounded-xl border px-3 py-2 text-sm"
                  value={onlyActive} onChange={e=>setOnlyActive(e.target.value)}>
            <option value="all">Todos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
          <select className="rounded-xl border px-3 py-2 text-sm"
                  value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="all">Todas las categorías</option>
            <option value="general">General</option>
            <option value="montaña">Montaña</option>
            <option value="ruta">Ruta</option>
            <option value="urbana">Urbana</option>
            <option value="accesorios">Accesorios</option>
          </select>
          <div className="text-sm text-slate-600 flex items-center">
            {loading ? "Cargando…" : `${filtered.length} resultados`}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="h-12 w-12 rounded-lg object-cover border"/>
                      : <div className="h-12 w-12 rounded-lg bg-slate-100 border" />
                    }
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{p.category || "general"}</td>
                <td className="px-4 py-3 text-right">{money(p.price)}</td>
                <td className="px-4 py-3 text-right">{p.stock ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                    (p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700")
                  }>
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="rounded-xl border px-3 py-1 hover:bg-slate-50"
                            onClick={()=>setEditing(p)}>Editar</button>
                    <button className="rounded-xl border px-3 py-1 hover:bg-slate-50"
                            onClick={()=>handleDelete(p.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length===0 && (
              <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={6}>Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      <ProductForm
        open={modalOpen}
        onClose={()=>setModalOpen(false)}
        onSubmit={handleCreate}
      />
      <ProductForm
        open={!!editing}
        initial={editing}
        onClose={()=>setEditing(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

