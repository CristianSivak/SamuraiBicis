import { useEffect, useMemo, useState } from "react";
import { listOrders } from "../../services/orders";
import { listProducts } from "../../services/products";
import { subscribeClients } from "../../services/accounts";

const numberFormatter = new Intl.NumberFormat("es-AR");
const currencyFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

const statusClasses = {
  pagada: "bg-emerald-100 text-emerald-700",
  pendiente: "bg-amber-100 text-amber-800",
  cancelada: "bg-rose-100 text-rose-700",
  solicitud: "bg-sky-100 text-sky-800",
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

function StatCard({ title, value, delta, children }) {
  const showDelta = typeof delta === "number";
  const deltaColor = !showDelta ? "" : delta >= 0 ? "text-emerald-600" : "text-rose-600";
  const deltaSign = !showDelta ? "" : delta >= 0 ? "▲" : "▼";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        {showDelta && (
          <div className={`text-xs ${deltaColor}`}>{deltaSign} {Math.abs(delta)}%</div>
        )}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function Spark({ points = "0,20 5,15 10,18 15,12 20,14 25,9 30,11 35,5 40,8" }) {
  return (
    <svg viewBox="0 0 40 20" className="h-12 w-full">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-indigo-500"
        points={points}
      />
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
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-600">Resumen de métricas y actividad reciente.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Usuarios"
          value={isNil(metrics.users) ? "…" : formatNumber(metrics.users)}
          delta={null}
        >
          <Spark />
        </StatCard>
        <StatCard
          title="Productos"
          value={isNil(metrics.products) ? "…" : formatNumber(metrics.products)}
          delta={null}
        >
          <Spark points="0,15 5,12 10,10 15,11 20,9 25,7 30,8 35,6 40,7" />
        </StatCard>
        <StatCard
          title="Órdenes (hoy)"
          value={isNil(metrics.ordersToday) ? "…" : formatNumber(metrics.ordersToday)}
          delta={null}
        >
          <Spark points="0,5 5,7 10,6 15,9 20,7 25,11 30,9 35,13 40,10" />
        </StatCard>
        <StatCard
          title="Ingresos"
          value={isNil(metrics.revenue) ? "…" : formatCurrency(metrics.revenue)}
          delta={null}
        >
          <Spark points="0,18 5,14 10,16 15,10 20,12 25,6 30,9 35,4 40,7" />
        </StatCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Órdenes recientes</h2>
            {loading && <span className="text-xs text-slate-500">Cargando…</span>}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <ul className="divide-y text-sm">
            {recentOrders.length === 0 ? (
              <li className="py-6 text-center text-slate-500">
                {loading ? "Cargando órdenes…" : "No hay órdenes recientes."}
              </li>
            ) : (
              recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-700">#{order.id}</span>
                    <div className="flex flex-col">
                      <span className="text-slate-700">
                        {order.customer?.name || "Cliente sin nombre"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusClasses[order.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {statusLabels[order.status] || order.status || "Sin estado"}
                    </span>
                    <span className="font-medium">{formatCurrency(order.total)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Actividad</h2>
          <ol className="space-y-3 text-sm text-slate-700">
            {activity.length === 0 ? (
              <li className="text-slate-500">
                {loading ? "Cargando actividad…" : "Sin actividad reciente."}
              </li>
            ) : (
              activity.map((item) => (
                <li key={item.id}>
                  <div className="font-medium text-slate-800">{item.title}</div>
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
