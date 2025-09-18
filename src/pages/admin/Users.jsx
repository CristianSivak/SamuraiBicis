import { useEffect, useMemo, useState } from "react";
import {
  subscribeClients,
  createAccount,
  updateAccount,
  toggleAccountStatus,
  removeAccount,
} from "../../services/accounts";
import { approveAndInvite } from "../../services/invite";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BusyButtonContent, LoadingOverlay } from "../../components/ui/LoadingIndicators";

const statusStyles = {
  activo: "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  suspendido: "border border-amber-400/40 bg-amber-500/15 text-amber-200",
  pending: "border border-sky-400/40 bg-sky-500/15 text-sky-200",
  rejected: "border border-rose-400/40 bg-rose-500/15 text-rose-200",
};

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

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
        await createAccount({ ...data, kind: "client" });
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
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/40 p-8 shadow-[0_45px_80px_-50px_rgba(15,23,42,0.95)]">
        <div className="absolute -right-28 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              Gestión de usuarios
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Usuarios</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Administrá cuentas y permisos con un flujo que refleja los estados de carga y guardado en tiempo real.
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:translate-y-[-1px]"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Nuevo usuario
          </button>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-[0_35px_65px_-45px_rgba(15,23,42,0.9)]">
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Buscar por nombre o email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
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
            className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
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

      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/40 shadow-[0_40px_70px_-45px_rgba(15,23,42,0.9)]">
        {loading && (
          <LoadingOverlay
            label="Cargando usuarios…"
            className="rounded-[inherit] border border-slate-800/70 bg-slate-950/80 text-slate-200"
            labelClassName="text-slate-200"
          />
        )}
        <table className="min-w-full divide-y divide-slate-800/70 text-sm text-slate-200">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-slate-400" colSpan={5}>
                  Sin resultados.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 text-slate-200">{row.name || "-"}</td>
                <td className="px-4 py-4 text-slate-200">{row.email || "-"}</td>
                <td className="px-4 py-4 capitalize text-slate-300">{row.role}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      statusStyles[row.status] || "border border-slate-700 bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 transition hover:border-sky-400 hover:text-white"
                      onClick={() => {
                        setEditing(row);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 transition hover:border-amber-400 hover:text-white"
                      onClick={() => onToggle(row)}
                    >
                      {row.status === "activo" ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 transition hover:border-emerald-400 hover:text-white disabled:opacity-60"
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
                      className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 transition hover:border-rose-400 hover:text-white"
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
      />
    </div>
  );
}

function UserModal({ open, onClose, onSubmit, initial }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [role, setRole] = useState(initial?.role || "viewer");
  const [status, setStatus] = useState(initial?.status || "activo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initial?.name || "");
    setEmail(initial?.email || "");
    setRole(initial?.role || "viewer");
    setStatus(initial?.status || "activo");
  }, [initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {initial?.id ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <button onClick={onClose} className="rounded-2xl px-3 py-2 text-xs text-slate-300 hover:bg-slate-900/70">
            Cerrar
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onSubmit({ name, email, role, status });
            setSaving(false);
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Nombre</label>
            <input
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Rol</label>
              <select
                className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Estado</label>
              <select
                className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-800/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/70"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
            >
              <BusyButtonContent busy={saving} busyLabel="Guardando…" label="Guardar" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
