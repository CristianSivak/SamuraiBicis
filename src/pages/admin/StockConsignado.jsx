import { useEffect, useMemo, useState } from "react";
import { getContabiliumDepositos } from "../../services/contabiliumDepositos";
import { getDepositoStockAdmin } from "../../services/comprobantes";
import { LoadingOverlay } from "../../components/ui/LoadingIndicators";

export default function StockConsignado() {
  const [depositos, setDepositos] = useState([]);
  const [loadingDepositos, setLoadingDepositos] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [items, setItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getContabiliumDepositos()
      .then(setDepositos)
      .catch((e) => console.error("Error cargando depósitos:", e))
      .finally(() => setLoadingDepositos(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return depositos;
    return depositos.filter((d) => d.nombre.toLowerCase().includes(q));
  }, [depositos, search]);

  async function selectDeposito(d) {
    setSelected(d);
    setItems(null);
    setError("");
    setLoadingItems(true);
    try {
      const result = await getDepositoStockAdmin(d.id);
      setItems(result.items);
    } catch (e) {
      setError(e.message || "Error al consultar el stock");
    } finally {
      setLoadingItems(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Stock consignado</h1>
        <p className="mt-1 text-sm text-slate-500">
          Elegí un distribuidor para ver su stock real (bicicletas y accesorios) en Contabilium.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            placeholder="Buscar distribuidor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
          />
          <div className="relative mt-3 max-h-[65vh] space-y-1 overflow-y-auto">
            {loadingDepositos && (
              <p className="px-2 py-4 text-xs text-slate-500">Cargando depósitos…</p>
            )}
            {!loadingDepositos && filtered.length === 0 && (
              <p className="px-2 py-4 text-xs text-slate-500">Sin resultados.</p>
            )}
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => selectDeposito(d)}
                className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${
                  selected?.id === d.id
                    ? "bg-sky-500 text-white shadow-md shadow-sky-200/60"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {d.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[300px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {!selected && (
            <div className="flex h-full min-h-[260px] items-center justify-center text-center text-sm text-slate-500">
              Elegí un distribuidor de la lista para ver su stock.
            </div>
          )}

          {selected && (
            <>
              <h2 className="text-lg font-semibold text-slate-900">{selected.nombre}</h2>

              {loadingItems && (
                <LoadingOverlay
                  label="Consultando Contabilium…"
                  className="rounded-[inherit] border border-slate-200 bg-white/90 text-slate-600"
                  labelClassName="text-slate-500"
                />
              )}

              {!loadingItems && error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!loadingItems && !error && items && (
                items.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                    Este distribuidor no tiene stock disponible ahora mismo.
                  </div>
                ) : (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <li
                        key={item.id || item.sku}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-1" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[9px] text-slate-400">Sin imagen</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {item.stockDisponible} disponible{item.stockDisponible === 1 ? "" : "s"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
