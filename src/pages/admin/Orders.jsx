import { useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { listOrders, updateOrderStatus } from "../../services/orders";
import { useAuth } from "../../auth/AuthContext";
import { BusyButtonContent, LoadingOverlay } from "../../components/ui/LoadingIndicators";

const statusStyles = {
  pagada: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  pendiente: "border border-amber-200 bg-amber-50 text-amber-700",
  cancelada: "border border-rose-200 bg-rose-50 text-rose-700",
  solicitud: "border border-sky-200 bg-sky-50 text-sky-700",
};

function money(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default function Orders() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [actionError, setActionError] = useState("");
  const { loading: authLoading } = useAuth();

  async function fetchOrders(reset = true) {
    setLoading(true);
    try {
      const opts = {
        status,
        from: from ? new Date(from) : null,
        to: to ? new Date(to) : null,
        pageSize: 100,
        cursor: reset ? null : cursor,
      };
      const { items, nextCursor } = await listOrders(opts);
      setRows((prev) => (reset ? items : [...prev, ...items]));
      setCursor(nextCursor);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, from, to]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((o) => {
      const idText = String(o.id).toLowerCase().includes(query);
      const nameText = String(o.customerNameLower || o.customer?.name || "")
        .toLowerCase()
        .includes(query);
      const emailText = String(o.customer?.email || "").toLowerCase().includes(query);
      const phoneText = String(o.customer?.phone || "").toLowerCase().includes(query);
      const notesText = String(o.customer?.notes || "").toLowerCase().includes(query);
      return idText || nameText || emailText || phoneText || notesText;
    });
  }, [rows, q]);

  const total = useMemo(() => filtered.reduce((a, b) => a + Number(b.total || 0), 0), [filtered]);

  async function markPaid(id) {
    setActionError("");
    try {
      await updateOrderStatus(id, "pagada");
      setRows((prev) => prev.map((o) => (o.id === id ? { ...o, status: "pagada" } : o)));
    } catch (e) {
      console.error(e);
      if (e instanceof FirebaseError) {
        setActionError("Necesitás permisos de administrador");
      } else {
        setActionError("No se pudo actualizar la orden.");
      }
    }
  }
  async function cancel(id) {
    setActionError("");
    try {
      await updateOrderStatus(id, "cancelada");
      setRows((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelada" } : o)));
    } catch (e) {
      console.error(e);
      if (e instanceof FirebaseError) {
        setActionError("Necesitás permisos de administrador");
      } else {
        setActionError("No se pudo actualizar la orden.");
      }
    }
  }
  async function reactivate(id) {
    setActionError("");
    try {
      await updateOrderStatus(id, "pendiente");
      setRows((prev) => prev.map((o) => (o.id === id ? { ...o, status: "pendiente" } : o)));
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_85px_-60px_rgba(15,23,42,0.35)]">
        <div className="absolute -right-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-indigo-200/60 blur-3xl" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
            Gestión de órdenes
          </div>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-center">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Órdenes</h1>
              <p className="mt-3 text-sm text-slate-600">
                Controlá el flujo de pedidos con filtros dinámicos y loaders visibles para cada sincronización.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Total filtrado: <span className="font-semibold text-slate-900">{money(total)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_65px_-45px_rgba(15,23,42,0.35)]">
        <div className="grid gap-4 md:grid-cols-5">
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 md:col-span-2"
            placeholder="Buscar por #orden o cliente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pagada">Pagada</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelada">Cancelada</option>
            <option value="solicitud">Solicitud</option>
          </select>
          <input
            type="date"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={() => fetchOrders(false)}
            disabled={!cursor || loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BusyButtonContent busy={loading} busyLabel="Cargando…" label="Cargar más" />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_80px_-60px_rgba(15,23,42,0.35)]">
        {loading && (
          <LoadingOverlay
            label="Actualizando listado…"
            className="rounded-[inherit] border border-slate-200 bg-white/80 text-slate-600"
            labelClassName="text-slate-600"
          />
        )}
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left"># Orden</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Comentario</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-4 font-mono text-xs text-slate-500">#{o.id}</td>
                <td className="px-4 py-4">{o.customer?.name || "-"}</td>
                <td className="px-4 py-4">{o.customer?.email || "-"}</td>
                <td className="px-4 py-4">{o.customer?.phone || "-"}</td>
                <td className="px-4 py-4 max-w-[240px] break-words text-slate-500">{o.customer?.notes || "-"}</td>
                <td className="px-4 py-4 text-slate-500">
                  {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString("es-AR") : "-"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      statusStyles[o.status] || "border border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current/80" />
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-slate-900">{money(o.total || 0)}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    {o.status !== "pagada" && o.status !== "cancelada" && (
                      <button
                        onClick={() => markPaid(o.id)}
                        disabled={authLoading}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Marcar pagada
                      </button>
                    )}
                    {o.status !== "cancelada" && (
                      <button
                        onClick={() => cancel(o.id)}
                        disabled={authLoading}
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                    )}
                    {o.status === "cancelada" && (
                      <button
                        onClick={() => reactivate(o.id)}
                        disabled={authLoading}
                        className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={9}>
                    {loading ? "Cargando órdenes…" : "Sin resultados."}
                  </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
