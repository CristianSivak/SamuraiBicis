import { useEffect, useMemo, useState } from "react";
import { listOrders } from "../../services/orders";
import { listProducts } from "../../services/products";
import { subscribeClients } from "../../services/accounts";
import { LoadingOverlay } from "../../components/ui/LoadingIndicators";

const numberFormatter = new Intl.NumberFormat("es-AR");
const currencyFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

const statusClasses = {
  pagada: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  pendiente: "border border-amber-200 bg-amber-50 text-amber-700",
  cancelada: "border border-rose-200 bg-rose-50 text-rose-700",
  solicitud: "border border-sky-200 bg-sky-50 text-sky-700",
};

const statusLabels = {
  pagada: "Pagada",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
  solicitud: "Solicitud",
};

function isNil(value) {
  return value === null || value === undefined;
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    return value.toDate();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value) {
  const date = toDate(value);
  return date ? date.toLocaleString("es-AR") : "";
}

function StatCard({ title, value, delta, accent = "from-sky-500 to-indigo-500", children, caption }) {
  const showDelta = typeof delta === "number";
  const deltaColor = !showDelta ? "" : delta >= 0 ? "text-emerald-600" : "text-rose-600";
  const deltaSign = !showDelta ? "" : delta >= 0 ? "▲" : "▼";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-slate-700 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.3)]">
      <div className={`pointer-events-none absolute -right-12 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-3xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
          {caption ? <p className="mt-2 text-xs text-slate-500">{caption}</p> : null}
        </div>
        {showDelta && (
          <div className={`rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs ${deltaColor}`}>
            {deltaSign} {Math.abs(delta)}%
          </div>
        )}
      </div>
      {children ? <div className="relative mt-4 text-slate-500">{children}</div> : null}
    </div>
  );
}

function Spark({ points = "0,20 5,15 10,18 15,12 20,14 25,9 30,11 35,5 40,8" }) {
  return (
    <svg viewBox="0 0 40 20" className="h-14 w-full text-sky-400">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    users: null,
    products: null,
    ordersToday: null,
    revenue: null,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeClients(
      "all",
      (items) => {
        setMetrics((prev) => ({ ...prev, users: items.length }));
      },
      (err) => {
        console.error(err);
        setError((prev) => prev || "No se pudieron cargar los usuarios.");
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchOrdersForToday() {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      let cursor = null;
      let all = [];
      const pageSize = 50;

      for (let page = 0; page < 20; page += 1) {
        const { items, nextCursor } = await listOrders({ from: start, to: end, pageSize, cursor });
        if (!items.length) break;
        all = all.concat(items);
        cursor = nextCursor;
        if (!cursor) break;
      }

      const revenue = all.reduce(
        (acc, order) => (order.status === "pagada" ? acc + Number(order.total || 0) : acc),
        0
      );

      return { count: all.length, revenue };
    }

    async function countAllProducts() {
      let cursor = null;
      let total = 0;
      const pageSize = 100;

      for (let page = 0; page < 50; page += 1) {
        const { items, nextCursor } = await listProducts({ pageSize, cursor });
        total += items.length;
        cursor = nextCursor;
        if (!cursor || items.length === 0) break;
      }

      return total;
    }

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [recent, today, productsTotal] = await Promise.all([
          listOrders({ pageSize: 5 }),
          fetchOrdersForToday(),
          countAllProducts(),
        ]);

        if (!active) return;

        setRecentOrders(recent.items);
        setMetrics((prev) => ({
          ...prev,
          products: productsTotal,
          ordersToday: today.count,
          revenue: today.revenue,
        }));
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError("No se pudieron cargar los datos del dashboard.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const activity = useMemo(() => {
    if (!recentOrders.length) return [];
    return recentOrders.slice(0, 5).map((order) => {
      const customerName = order.customer?.name?.trim() || "Cliente sin nombre";
      const statusLabel = statusLabels[order.status] || order.status || "Sin estado";
      const timestamp = formatDateTime(order.createdAt);
      const subtitleParts = [`Orden #${order.id}`, statusLabel];
      if (timestamp) subtitleParts.push(timestamp);
      return {
        id: order.id,
        title: customerName,
        subtitle: subtitleParts.join(" · "),
      };
    });
  }, [recentOrders]);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_85px_-55px_rgba(15,23,42,0.35)]">
        <div className="absolute -right-32 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              Panel Samurai
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                Métricas en tiempo real con loaders claros para cada flujo.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Consultá usuarios, inventario y performance diaria con tarjetas animadas y estados visibles mientras actualizamos la información del backend.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Usuarios", value: isNil(metrics.users) ? "…" : formatNumber(metrics.users) },
                { label: "Órdenes hoy", value: isNil(metrics.ordersToday) ? "…" : formatNumber(metrics.ordersToday) },
                { label: "Ingresos hoy", value: isNil(metrics.revenue) ? "…" : formatCurrency(metrics.revenue) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{item.label}</dt>
                  <dd className="mt-2 text-lg font-semibold text-slate-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">Rendimiento de la jornada</p>
            <p className="text-xs text-slate-500">
              Actualizamos estas métricas cada vez que se procesa una orden o se sincroniza el catálogo.
            </p>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Inventario total</span>
                <span className="font-semibold text-slate-900">{isNil(metrics.products) ? "…" : formatNumber(metrics.products)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Promedio ticket</span>
                <span className="font-semibold text-slate-900">
                  {isNil(metrics.revenue) || isNil(metrics.ordersToday) || metrics.ordersToday === 0
                    ? "…"
                    : formatCurrency(metrics.revenue / metrics.ordersToday)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estado de carga</span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                    loading
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${loading ? "bg-amber-400" : "bg-emerald-500"}`}
                  />
                  {loading ? "Sincronizando" : "Al día"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Usuarios"
          value={isNil(metrics.users) ? "…" : formatNumber(metrics.users)}
          accent="from-sky-500 to-cyan-500"
        >
          <Spark />
        </StatCard>
        <StatCard
          title="Productos"
          value={isNil(metrics.products) ? "…" : formatNumber(metrics.products)}
          accent="from-indigo-500 to-fuchsia-500"
        >
          <Spark points="0,15 5,12 10,10 15,11 20,9 25,7 30,8 35,6 40,7" />
        </StatCard>
        <StatCard
          title="Órdenes (hoy)"
          value={isNil(metrics.ordersToday) ? "…" : formatNumber(metrics.ordersToday)}
          accent="from-emerald-500 to-sky-500"
        >
          <Spark points="0,5 5,7 10,6 15,9 20,7 25,11 30,9 35,13 40,10" />
        </StatCard>
        <StatCard
          title="Ingresos"
          value={isNil(metrics.revenue) ? "…" : formatCurrency(metrics.revenue)}
          accent="from-amber-500 to-orange-500"
        >
          <Spark points="0,18 5,14 10,16 15,10 20,12 25,6 30,9 35,4 40,7" />
        </StatCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_40px_80px_-60px_rgba(15,23,42,0.35)] xl:col-span-2">
          {loading && (
            <LoadingOverlay
              label="Actualizando órdenes…"
              className="rounded-[inherit] border border-slate-200 bg-white/80 text-slate-600"
              labelClassName="text-slate-600"
            />
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Órdenes recientes</h2>
            <span className="text-xs text-slate-500">Refrescamos cada 60 segundos</span>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <ul className="mt-4 divide-y divide-slate-200 text-sm text-slate-600">
            {recentOrders.length === 0 ? (
              <li className="py-10 text-center text-slate-500">
                {loading ? "Cargando órdenes…" : "No hay órdenes recientes."}
              </li>
            ) : (
              recentOrders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-500">#{order.id}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{order.customer?.name || "Cliente sin nombre"}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                        statusClasses[order.status] || "border border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current/80" />
                      {statusLabels[order.status] || order.status || "Sin estado"}
                    </span>
                    <span className="font-semibold text-slate-900">{formatCurrency(order.total)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_40px_80px_-60px_rgba(15,23,42,0.35)]">
          {loading && (
            <LoadingOverlay
              label="Cargando actividad…"
              className="rounded-[inherit] border border-slate-200 bg-white/80 text-slate-600"
              labelClassName="text-slate-600"
            />
          )}
          <h2 className="text-lg font-semibold text-slate-900">Actividad</h2>
          <ol className="mt-4 space-y-4 text-sm text-slate-600">
            {activity.length === 0 ? (
              <li className="text-slate-500">
                {loading ? "Cargando actividad…" : "Sin actividad reciente."}
              </li>
            ) : (
              activity.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.subtitle}</div>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
