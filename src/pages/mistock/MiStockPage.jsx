import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getMyDepositoStock } from "../../services/comprobantes";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Cargando tu stock...
    </div>
  );
}

export default function MiStockPage() {
  const { user } = useAuth();
  const history = useHistory();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { history.push("/login"); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyDepositoStock()
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user, history]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Mi stock</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data?.depositoNombre
            ? `Stock consignado en tu depósito: ${data.depositoNombre}`
            : "Stock consignado en Contabilium."}
        </p>
      </div>

      {loading && <Spinner />}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error.includes("sin depósito")
            ? "Todavía no tenés un depósito consignado asignado. Escribinos si creés que esto es un error."
            : `No pudimos cargar tu stock: ${error}`}
        </div>
      )}

      {!loading && !error && data && (
        data.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
            No tenés stock consignado disponible en este momento.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <li
                key={item.id || item.sku}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_15px_35px_-25px_rgba(15,23,42,0.2)]"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-slate-400">Sin imagen</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                  <p className="mt-1 text-sm font-medium text-emerald-600">
                    {item.stockDisponible} disponible{item.stockDisponible === 1 ? "" : "s"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
