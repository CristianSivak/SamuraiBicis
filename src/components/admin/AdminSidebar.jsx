import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin", label: "Dashboard", icon: DashboardIcon, exact: true },
  { to: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { to: "/admin/products", label: "Productos", icon: BoxIcon },
  { to: "/admin/stock-consignado", label: "Stock consignado", icon: BoxIcon },
  { to: "/admin/orders", label: "Órdenes", icon: ReceiptIcon },
  { to: "/admin/product-types", label: "Tipos de producto", icon: LayersIcon },
  { to: "/admin/customer-types", label: "Tipos de cliente", icon: TagIcon },
  { to: "/admin/settings", label: "Configuración", icon: SettingsIcon },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const Item = ({ to, label, icon, exact }) => {
    const Icon = icon;
    return (
      <NavLink
        exact={!!exact}
        to={to}
        title={collapsed ? label : undefined}
        className="group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        activeClassName="bg-white text-slate-900 shadow-lg shadow-sky-100"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-slate-200 group-hover:text-slate-900">
          <Icon className="h-5 w-5" />
        </span>
        {!collapsed && <span className="truncate">{label}</span>}
        <span className="pointer-events-none absolute inset-0 rounded-2xl border border-slate-200 opacity-0 transition group-hover:opacity-100" />
      </NavLink>
    );
  };
  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500" />
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-slate-900">Samurai Admin</p>
              <p className="text-xs text-slate-500">Panel renovado</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="rounded-2xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 transition hover:border-sky-400 hover:text-slate-900"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="mt-6 space-y-2">
        {items.map((it) => (
          <Item key={it.to} {...it} />
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
        {!collapsed ? (
          <>
            <p className="font-semibold text-slate-900">Estado del sistema</p>
            <p className="mt-2 text-slate-500">Uptime 99.97%</p>
            <p className="text-slate-500">Build v1.4.0</p>
          </>
        ) : (
          <div className="text-center text-slate-500">v1.4</div>
        )}
      </div>
    </div>
  );
}

function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" strokeWidth="1.5" />
    </svg>
  );
}
function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BoxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7.3 12 12l8.7-4.7" />
    </svg>
  );
}
function ReceiptIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 3h14l2 3v14a2 2 0 0 1-2 2H4z" />
      <path d="M8 12h8M8 7h8M8 17h5" />
    </svg>
  );
}

function LayersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function TagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z" />
      <path d="M7 7h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
