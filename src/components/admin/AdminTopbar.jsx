import { useEffect, useRef, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import {
  subscribeNotifications,
  markNotificationRead,
  markNotificationAttended,
  markAllNotificationsRead,
} from "../../services/notifications";

function money(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function timeAgo(date) {
  if (!date) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "hace instantes";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return date.toLocaleDateString("es-AR");
}

// Bloque de texto listo para pegar la carga en Contabilium (flujo manual asistido).
function buildContabiliumText(n) {
  const lines = [
    `Pedido #${n.orderId}`,
    `Cliente: ${n.customerName}`,
    n.customerCuit ? `CUIT: ${n.customerCuit}` : null,
    n.contabilium?.idListaPrecio != null ? `Lista de precios: ${n.contabilium.idListaPrecio}` : null,
    n.contabilium?.condicionIva != null ? `Condición IVA: ${n.contabilium.condicionIva}` : null,
    n.customerEmail ? `Email: ${n.customerEmail}` : null,
    n.customerPhone ? `Teléfono: ${n.customerPhone}` : null,
    "",
    "Detalle:",
    ...(n.items || []).map(
      (it) => `• ${it.name} x${it.qty} — ${money(it.price)} c/u — ${money(it.price * it.qty)}`
    ),
    "",
    `Total: ${money(n.total)}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export default function AdminTopbar({ onToggleSidebar, collapsed }) {
  const history = useHistory();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeNotifications(
      (items) => setNotifications(items),
      (err) => console.error("notifications:", err)
    );
    return unsub;
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  async function handleOpenOrder(n) {
    try {
      if (!n.read) await markNotificationRead(n.id);
    } catch (err) {
      console.error(err);
    }
    setOpen(false);
    history.push("/admin/orders");
  }

  async function handleCopy(n) {
    try {
      await navigator.clipboard.writeText(buildContabiliumText(n));
      setCopiedId(n.id);
      setTimeout(() => setCopiedId((id) => (id === n.id ? null : id)), 1800);
      if (!n.attended) await markNotificationAttended(n.id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-5 sm:px-8">
        <button
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-slate-900 xl:hidden"
          onClick={onToggleSidebar}
        >
          {collapsed ? "Menú" : "Cerrar"}
        </button>

        <div className="hidden md:flex items-center gap-3 text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500">
            Samurai Admin
          </span>
          <span className="text-slate-300">•</span>
          <Link to="/" className="text-xs font-medium text-slate-500 transition hover:text-slate-900">
            Volver a tienda
          </Link>
        </div>

        <div className="ml-auto flex flex-1 items-center gap-4">
          <div className="hidden lg:block flex-1">
            <label className="sr-only">Buscar</label>
            <input
              type="search"
              placeholder="Buscar en el panel"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
            />
          </div>

          {/* Campana de notificaciones (M5) */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
            >
              <BellIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaciones</span>
              {unread > 0 ? (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_80px_-40px_rgba(15,23,42,0.4)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Pedidos por cargar {unread > 0 && <span className="text-rose-500">({unread})</span>}
                  </p>
                  {unread > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead().catch(console.error)}
                      className="text-xs font-medium text-sky-600 transition hover:text-sky-800"
                    >
                      Marcar todas leídas
                    </button>
                  )}
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-400">
                      No hay notificaciones.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`border-b border-slate-100 px-4 py-3 transition ${
                          n.read ? "bg-white" : "bg-sky-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => handleOpenOrder(n)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                              <span className="truncate text-sm font-semibold text-slate-900">
                                Nuevo pedido #{n.orderId}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-600">
                              {n.customerName}
                              {n.customerCuit ? ` · CUIT ${n.customerCuit}` : ""}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {n.itemsCount} ítem{n.itemsCount === 1 ? "" : "s"} · {money(n.total)}
                              {n.contabilium?.idListaPrecio != null
                                ? ` · Lista ${n.contabilium.idListaPrecio}`
                                : ""}
                            </p>
                          </button>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(n)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
                          >
                            {copiedId === n.id ? "¡Copiado!" : "Copiar para Contabilium"}
                          </button>
                          {n.attended && (
                            <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                              Cargado
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  to="/admin/orders"
                  onClick={() => setOpen(false)}
                  className="block border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                >
                  Ver todas las órdenes
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500" title="Mi cuenta" />
            <div className="hidden text-xs text-slate-500 sm:block">
              <div className="font-semibold text-slate-900">Admin</div>
              <div>online</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
