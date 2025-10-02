import { useEffect, useMemo, useState } from "react";
import {
  subscribeCustomerTypes,
  createCustomerType,
  updateCustomerType,
  removeCustomerType,
} from "../../services/customerTypes";
import { BusyButtonContent, LoadingOverlay } from "../../components/ui/LoadingIndicators";

export default function CustomerTypes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeCustomerTypes(
      (items) => {
        setRows(items);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
        alert("No se pudieron cargar los tipos de cliente.");
      }
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.title?.toLowerCase().includes(q));
  }, [rows, query]);

  async function handleSubmit(data) {
    try {
      if (editing?.id) {
        await updateCustomerType(editing.id, data);
      } else {
        await createCustomerType(data);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el tipo de cliente.");
    }
  }

  async function handleDelete(row) {
    if (!confirm(`¿Eliminar la categoría "${row.title}"?`)) return;
    try {
      await removeCustomerType(row.id);
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el tipo de cliente.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_80px_-50px_rgba(15,23,42,0.2)]">
        <div className="absolute -right-28 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              Catálogo de descuentos
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Tipos de cliente</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-500">
                Organizá las categorías de clientes mayoristas y sus porcentajes de descuento para reutilizarlos al crear o editar cuentas.
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition hover:-translate-y-0.5"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Nuevo tipo
          </button>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_65px_-45px_rgba(15,23,42,0.18)]">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
          placeholder="Buscar por nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_70px_-45px_rgba(15,23,42,0.18)]">
        {loading && (
          <LoadingOverlay
            label="Cargando tipos…"
            className="rounded-[inherit] border border-slate-200 bg-white text-slate-600"
            labelClassName="text-slate-600"
          />
        )}
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Descuento</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={3}>
                  No hay tipos de cliente.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 text-slate-700">{row.title || "-"}</td>
                <td className="px-4 py-4 text-slate-600">{formatDiscount(row.discount)}</td>
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
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-rose-400 hover:text-slate-900"
                      onClick={() => handleDelete(row)}
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

      <CustomerTypeModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function CustomerTypeModal({ open, onClose, onSubmit, initial }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [discount, setDiscount] = useState(initial?.discount ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(initial?.title || "");
    setDiscount(initial?.discount ?? 0);
  }, [initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {initial?.id ? "Editar tipo" : "Nuevo tipo"}
          </h2>
          <button onClick={onClose} className="rounded-2xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">
            Cerrar
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            await onSubmit({
              title,
              discount: Number(discount) || 0,
            });
            setSaving(false);
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Título</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Descuento (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              required
            />
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

function formatDiscount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0%";
  return `${num.toFixed(num % 1 === 0 ? 0 : 2)}%`;
}

