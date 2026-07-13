import { useEffect, useMemo, useState } from "react";
import {
  subscribeClients,
  createUser,
  updateAccount,
  toggleAccountStatus,
  removeAccount,
  syncClientContabiliumProfile,
} from "../../services/accounts";
import { approveAndInvite } from "../../services/invite";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BusyButtonContent, LoadingOverlay } from "../../components/ui/LoadingIndicators";
import { subscribeCustomerTypes } from "../../services/customerTypes";
import { getContabiliumDepositos } from "../../services/contabiliumDepositos";
import { getDepositoStockAdmin } from "../../services/comprobantes";

const statusStyles = {
  activo: "border border-emerald-200 bg-emerald-50 text-emerald-600",
  suspendido: "border border-amber-200 bg-amber-50 text-amber-600",
  pending: "border border-sky-200 bg-sky-50 text-sky-600",
  rejected: "border border-rose-200 bg-rose-50 text-rose-600",
};

function formatDiscount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0%";
  return `${num.toFixed(num % 1 === 0 ? 0 : 2)}%`;
}

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [customerTypes, setCustomerTypes] = useState([]);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setLoading(true);

    const unsub = subscribeClients(
      "all",
      (items) => {
        setRows(items);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setLoading(false);
        alert("No se pudieron cargar los usuarios.");
      }
    );
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeCustomerTypes(
      (items) => {
        setCustomerTypes(items);
      },
      (error) => {
        console.error(error);
        alert("No se pudieron cargar las categorías de cliente.");
      }
    );

    return () => unsub && unsub();
  }, []);

  const customerTypeMap = useMemo(() => {
    const map = new Map();
    customerTypes.forEach((type) => {
      if (type?.id) map.set(type.id, type);
    });
    return map;
  }, [customerTypes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((u) => {
      const matchText = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchRole = role === "all" ? true : u.role === role;
      const matchStatus = status === "all" ? true : u.status === status;
      return matchText && matchRole && matchStatus;
    });
  }, [rows, query, role, status]);

  async function onSubmitUser(data) {
    try {
      if (editing?.id) {
        await updateAccount(editing.id, data);
      } else {
        await createUser({ ...data, kind: "client" });
      }
      setModalOpen(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el usuario.");
    }
  }

  async function onToggle(u) {
    const next = u.status === "activo" ? "suspendido" : "activo";
    try {
      await toggleAccountStatus(u.id, next);
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado.");
    }
  }

  async function onDelete(u) {
    if (!confirm(`¿Eliminar a ${u.name || u.email}?`)) return;
    try {
      await removeAccount(u.id);
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_80px_-50px_rgba(15,23,42,0.2)]">
        <div className="absolute -right-28 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              Gestión de usuarios
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Usuarios</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-500">
                Administrá cuentas y permisos con un flujo que refleja los estados de carga y guardado en tiempo real.
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:-translate-y-0.5"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Nuevo usuario
          </button>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_65px_-45px_rgba(15,23,42,0.18)]">
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Buscar por nombre o email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
            <option value="client">Client</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="suspendido">Suspendido</option>
            <option value="pending">Pendiente</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_70px_-45px_rgba(15,23,42,0.18)]">
        {loading && (
          <LoadingOverlay
            label="Cargando usuarios…"
            className="rounded-[inherit] border border-slate-200 bg-white text-slate-600"
            labelClassName="text-slate-600"
          />
        )}
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Tipo de cliente</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={6}>
                  Sin resultados.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 text-slate-600">{row.name || "-"}</td>
                <td className="px-4 py-4 text-slate-600">{row.email || "-"}</td>
                <td className="px-4 py-4 capitalize text-slate-500">{row.role}</td>
                <td className="px-4 py-4 text-slate-500">
                  {customerTypeMap.get(row.customerTypeId)?.title || "-"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      statusStyles[row.status] || "border border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
                      onClick={() => {
                        setEditing(row);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-amber-400 hover:text-slate-900"
                      onClick={() => onToggle(row)}
                    >
                      {row.status === "activo" ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-emerald-400 hover:text-slate-900 disabled:opacity-60"
                      disabled={!authReady}
                      onClick={async () => {
                        try {
                          const me = auth.currentUser;
                          if (!me) {
                            alert("No estás logueado");
                            return;
                          }
                          const { link } = await approveAndInvite(row.id);
                          window.prompt("Copiá y enviá este enlace al cliente:", link);
                        } catch (e) {
                          console.error(e);
                          alert("No se pudo aprobar/invitar.");
                        }
                      }}
                    >
                      Aprobar & Invitar
                    </button>
                    <button
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-rose-400 hover:text-slate-900"
                      onClick={() => onDelete(row)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmitUser}
        customerTypes={customerTypes}
      />
    </div>
  );
}

function UserModal({ open, onClose, onSubmit, initial, customerTypes }) {
  const [name, setName]               = useState(initial?.name || "");
  const [email, setEmail]             = useState(initial?.email || "");
  const [role, setRole]               = useState(initial?.role || "viewer");
  const [status, setStatus]           = useState(initial?.status || "activo");
  const [customerTypeId, setCustomerTypeId] = useState(initial?.customerTypeId || "");
  const [contabiliumId, setContabiliumId]   = useState(initial?.contabiliumId?.toString() || "");
  const [depositoId, setDepositoId] = useState(initial?.contabiliumDepositoId?.toString() || "");
  const [depositos, setDepositos] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState("");
  const [stockItems, setStockItems] = useState(null);
  const [contabiliumInfo, setContabiliumInfo] = useState(
    initial?.idListaPrecio != null
      ? { idListaPrecio: initial.idListaPrecio, condicionIva: initial.condicionIva }
      : null
  );
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getContabiliumDepositos()
      .then(setDepositos)
      .catch((e) => console.error("Error cargando depósitos de Contabilium:", e));
  }, [open]);

  useEffect(() => {
    setName(initial?.name || "");
    setEmail(initial?.email || "");
    setRole(initial?.role || "viewer");
    setStatus(initial?.status || "activo");
    setCustomerTypeId(initial?.customerTypeId || "");
    setContabiliumId(initial?.contabiliumId?.toString() || "");
    setDepositoId(initial?.contabiliumDepositoId?.toString() || "");
    setContabiliumInfo(
      initial?.idListaPrecio != null
        ? { idListaPrecio: initial.idListaPrecio, condicionIva: initial.condicionIva }
        : null
    );
    setSyncError("");
    setStockItems(null);
    setStockError("");
  }, [initial, open]);

  async function handleVerStock() {
    if (!depositoId) return;
    setStockLoading(true);
    setStockError("");
    setStockItems(null);
    try {
      const result = await getDepositoStockAdmin(Number(depositoId));
      setStockItems(result.items);
    } catch (e) {
      setStockError(e.message || "Error al consultar el stock");
    } finally {
      setStockLoading(false);
    }
  }

  async function handleSyncContabilium() {
    if (!initial?.id) return;
    setSyncing(true);
    setSyncError("");
    try {
      await updateAccount(initial.id, { contabiliumId: contabiliumId ? Number(contabiliumId) : null });
      const result = await syncClientContabiliumProfile(initial.id);
      setContabiliumId(result.contabiliumId.toString());
      setContabiliumInfo({ idListaPrecio: result.idListaPrecio, condicionIva: null });
    } catch (e) {
      setSyncError(e.message || "Error al sincronizar con Contabilium");
    } finally {
      setSyncing(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {initial?.id ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <button onClick={onClose} className="rounded-2xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">
            Cerrar
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onSubmit({
              name,
              email,
              role,
              status,
              customerTypeId:  customerTypeId || null,
              contabiliumId:   contabiliumId ? Number(contabiliumId) : null,
              contabiliumDepositoId: depositoId ? Number(depositoId) : null,
              contabiliumDepositoNombre:
                (depositos.find((d) => String(d.id) === depositoId)?.nombre) || null,
            });
            setSaving(false);
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Nombre</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Rol</label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Tipo de cliente</label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={customerTypeId || ""}
              onChange={(e) => setCustomerTypeId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {customerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.title} ({formatDiscount(type.discount)})
                </option>
              ))}
            </select>
          </div>

          {/* ── Contabilium ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contabilium</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="ID de cliente en Contabilium"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={contabiliumId}
                onChange={(e) => setContabiliumId(e.target.value)}
              />
              {initial?.id && (
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleSyncContabilium}
                  className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-600 transition hover:bg-sky-100 disabled:opacity-60"
                >
                  {syncing ? "Sincronizando…" : "Sincronizar"}
                </button>
              )}
            </div>
            {syncError && (
              <p className="text-xs text-rose-500">{syncError}</p>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Depósito consignado
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={depositoId}
                onChange={(e) => setDepositoId(e.target.value)}
              >
                <option value="">Sin depósito asignado</option>
                {depositos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Si asignás un depósito, este usuario va a poder ver su stock consignado en el sitio.
              </p>
              {depositoId && (
                <button
                  type="button"
                  disabled={stockLoading}
                  onClick={handleVerStock}
                  className="mt-1 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-600 transition hover:bg-sky-100 disabled:opacity-60"
                >
                  {stockLoading ? "Consultando…" : "Ver stock consignado"}
                </button>
              )}
              {stockError && (
                <p className="text-xs text-rose-500">{stockError}</p>
              )}
              {stockItems && (
                stockItems.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay stock disponible en este depósito ahora mismo.</p>
                ) : (
                  <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                    {stockItems.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-xs">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="shrink-0 font-semibold text-emerald-600">{item.stockDisponible}</span>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
            {contabiliumInfo && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-600 font-medium">
                  ✓ Vinculado
                </span>
                {contabiliumInfo.idListaPrecio != null && (
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-slate-600">
                    Lista de precios: #{contabiliumInfo.idListaPrecio}
                  </span>
                )}
                {contabiliumInfo.condicionIva && (
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-slate-600">
                    IVA: {contabiliumInfo.condicionIva}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
            >
              <BusyButtonContent busy={saving} busyLabel="Guardando…" label="Guardar" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
