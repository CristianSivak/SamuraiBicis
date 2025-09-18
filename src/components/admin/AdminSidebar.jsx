import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin", label: "Dashboard", icon: DashboardIcon, exact: true },
  { to: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { to: "/admin/products", label: "Productos", icon: BoxIcon },
  { to: "/admin/orders", label: "Órdenes", icon: ReceiptIcon },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const Item = ({ to, label, icon, exact }) => {
    const Icon = icon;
    return (
      <NavLink
        exact={!!exact}
        to={to}
        title={collapsed ? label : undefined}
        className="group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900/60 hover:text-white"
        activeClassName="bg-slate-900/80 text-white shadow-lg shadow-sky-900/40"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900/70 text-slate-400 transition group-hover:bg-slate-900 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        {!collapsed && <span className="truncate">{label}</span>}
        <span className="pointer-events-none absolute inset-0 rounded-2xl border border-slate-800/40 opacity-0 transition group-hover:opacity-100" />
      </NavLink>
    );
  };
  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/70 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500" />
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-white">Samurai Admin</p>
              <p className="text-xs text-slate-400">Panel renovado</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-300 transition hover:border-sky-500 hover:text-white"
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

      <div className="mt-auto rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 text-xs text-slate-300">
        {!collapsed ? (
          <>
            <p className="font-semibold text-white">Estado del sistema</p>
            <p className="mt-2 text-slate-400">Uptime 99.97%</p>
            <p className="text-slate-400">Build v1.4.0</p>
          </>
        ) : (
          <div className="text-center text-slate-400">v1.4</div>
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
