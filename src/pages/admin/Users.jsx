import { useEffect, useMemo, useState } from "react";
import {
  subscribeClients, createAccount, updateAccount, toggleAccountStatus, removeAccount
} from "../../services/accounts";
import { approveAndInvite } from "../../services/invite";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

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
      (items) => { setRows(items); setLoading(false); },
      (e) => { console.error(e); setLoading(false); alert("No se pudieron cargar los usuarios."); }
    );
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(u => {
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
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-slate-600">Gestión de cuentas y permisos.</p>
        </div>
        <div>
          <button
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
            onClick={() => { setEditing(null); setModalOpen(true); }}
          >
            Nuevo usuario
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Buscar por nombre o email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className="rounded-xl border px-3 py-2 text-sm"
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
            className="rounded-xl border px-3 py-2 text-sm"
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

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={5}>Cargando…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={5}>Sin resultados.</td></tr>
            )}
            {filtered.map(row => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">{row.name || "-"}</td>
                <td className="px-4 py-3">{row.email || "-"}</td>
                <td className="px-4 py-3 capitalize">{row.role}</td>
                <td className="px-4 py-3">
                  <span className={
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                    (row.status === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800")
                  }>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-xl border px-3 py-1 hover:bg-slate-50"
                      onClick={() => { setEditing(row); setModalOpen(true); }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-xl border px-3 py-1 hover:bg-slate-50"
                      onClick={() => onToggle(row)}
                    >
                      {row.status === "activo" ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-xl border px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
                      disabled={!authReady}
                      onClick={async () => {
                        try {
                          // Asegurar sesión lista
                          const me = auth.currentUser;
                          if (!me) { alert("No estás logueado"); return; }
                          // Llamada callable: el SDK adjunta el ID token automáticamente.
                          // OJO: hay que pasar el ID del doc de la fila (pendiente), no el UID del admin.
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
                      className="rounded-xl border px-3 py-1 hover:bg-slate-50"
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
        onClose={() => { setModalOpen(false); setEditing(null); }}
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

  // reset cuando cambia initial/open
  useEffect(() => {
    setName(initial?.name || "");
    setEmail(initial?.email || "");
    setRole(initial?.role || "viewer");
    setStatus(initial?.status || "activo");
  }, [initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initial?.id ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-50">✕</button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onSubmit({ name, email, role, status });
            setSaving(false);
          }}
        >
          <div>
            <label className="mb-1 block text-sm">Nombre</label>
            <input className="w-full rounded-xl border px-3 py-2 text-sm"
                   value={name} onChange={(e)=>setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input type="email" className="w-full rounded-xl border px-3 py-2 text-sm"
                   value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Rol</label>
              <select className="w-full rounded-xl border px-3 py-2 text-sm"
                      value={role} onChange={(e)=>setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Estado</label>
              <select className="w-full rounded-xl border px-3 py-2 text-sm"
                      value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

        <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose}
                    className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50">
              Cancelar
            </button>
            <button disabled={saving}
                    className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
