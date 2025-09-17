// pages/admin/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { listOrders, updateOrderStatus } from "../../services/orders";
import { useAuth } from "../../auth/AuthContext";

function money(n){ return Number(n||0).toLocaleString("es-AR",{style:"currency",currency:"ARS"}); }

export default function Orders(){
  const [q,setQ]=useState("");
  const [status,setStatus]=useState("all");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [rows,setRows]=useState([]);             // 🔹 órdenes reales
  const [loading,setLoading]=useState(true);
  const [cursor,setCursor]=useState(null);
  const [actionError, setActionError] = useState("");
  const { loading: authLoading } = useAuth();

  async function fetchOrders(reset=true){
    setLoading(true);
    try{
      const opts = {
        status,
        from: from? new Date(from): null,
        to:   to?   new Date(to):   null,
        pageSize: 100,
        cursor: reset? null : cursor,
      };
      const { items, nextCursor } = await listOrders(opts);
      setRows(prev => reset ? items : [...prev, ...items]);
      setCursor(nextCursor);
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ fetchOrders(true); },[status,from,to]);

  // Filtro por texto local (id o nombre cliente)
  const filtered = useMemo(()=>{
    const query = q.trim().toLowerCase();
    return rows.filter(o=>{
      const idText = String(o.id).toLowerCase().includes(query);
      const nameText = String(o.customerNameLower || o.customer?.name || "")
                        .toLowerCase().includes(query);
      return idText || nameText;
    });
  },[rows,q]);

  const total = useMemo(()=> filtered.reduce((a,b)=>a+Number(b.total||0),0),[filtered]);

  async function markPaid(id){
    setActionError("");
    try {
      await updateOrderStatus(id, "pagada");
      setRows(prev => prev.map(o => o.id===id ? {...o, status:"pagada"} : o));
    } catch (e) {
      console.error(e);
      if (e instanceof FirebaseError) {
        setActionError("Necesitás permisos de administrador");
      } else {
        setActionError("No se pudo actualizar la orden.");
      }
    }
  }
  async function cancel(id){
    setActionError("");
    try {
      await updateOrderStatus(id, "cancelada");
      setRows(prev => prev.map(o => o.id===id ? {...o, status:"cancelada"} : o));
    } catch (e) {
      console.error(e);
      if (e instanceof FirebaseError) {
        setActionError("Necesitás permisos de administrador");
      } else {
        setActionError("No se pudo actualizar la orden.");
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes</h1>
          <p className="text-slate-600">Listado, filtros y totales.</p>
        </div>
        <div className="text-sm text-slate-600">
          Total filtrado: <span className="font-semibold">{money(total)}</span>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <input className="rounded-xl border px-3 py-2 text-sm md:col-span-2"
                 placeholder="Buscar por #orden o cliente…" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="rounded-xl border px-3 py-2 text-sm"
                  value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="pagada">Pagada</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelada">Cancelada</option>
            <option value="solicitud">Solicitud</option>
          </select>
          <input type="date" className="rounded-xl border px-3 py-2 text-sm" value={from} onChange={e=>setFrom(e.target.value)} />
          <input type="date" className="rounded-xl border px-3 py-2 text-sm" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div className="mt-3 text-right">
          <button onClick={()=>fetchOrders(false)} disabled={!cursor}
                  className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50">
            Cargar más
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left"># Orden</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o=>(
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-mono break-all">#{o.id}</td>
                <td className="px-4 py-3">{o.customer?.name || "-"}</td>
                <td className="px-4 py-3">
                  {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString("es-AR")
                                       : "-"}
                </td>
                <td className="px-4 py-3">
                  <span className={
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                    (o.status==="pagada"?"bg-emerald-100 text-emerald-700":
                     o.status==="pendiente"?"bg-amber-100 text-amber-800":
                     o.status==="solicitud"?"bg-sky-100 text-sky-800":
                     "bg-rose-100 text-rose-700")
                  }>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-right">{money(o.total||0)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {o.status!=="pagada" && (
                      <button onClick={()=>markPaid(o.id)}
                              disabled={authLoading}
                              className="rounded-xl border px-3 py-1 hover:bg-slate-50 disabled:opacity-50">
                        Marcar pagada
                      </button>
                    )}
                    {o.status!=="cancelada" && (
                      <button onClick={()=>cancel(o.id)}
                              disabled={authLoading}
                              className="rounded-xl border px-3 py-1 hover:bg-slate-50 disabled:opacity-50">
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                {loading? "Cargando órdenes…" : "Sin resultados."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}