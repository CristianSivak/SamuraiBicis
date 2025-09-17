import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin", label: "Dashboard", icon: DashboardIcon, exact: true },
  { to: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { to: "/admin/products", label: "Productos", icon: BoxIcon },
  { to: "/admin/orders", label: "Órdenes", icon: ReceiptIcon },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const Item = ({ to, label, icon: Icon, exact }) => (
    <NavLink
      exact={!!exact}
      to={to}
      title={collapsed ? label : undefined}
      className="group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
      activeClassName="bg-slate-200 text-slate-900"
    >
      <Icon className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-slate-700" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 flex items-center justify-between px-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-black" />
          {!collapsed && <span className="font-semibold">Samurai Admin</span>}
        </div>
        <button
          onClick={onToggle}
          className="rounded-xl border px-2 py-1 text-xs hover:bg-slate-50"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {items.map(it => <Item key={it.to} {...it} />)}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-xl border p-3 text-xs text-slate-600">
          {!collapsed ? (
            <>
              <div className="font-semibold text-slate-800 mb-1">Estado</div>
              <div>Uptime: 99.9%</div>
              <div>Version: 0.1.0</div>
            </>
          ) : (
            <div className="text-center">v0.1</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* === Minimal inline icons === */
function DashboardIcon(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" strokeWidth="1.5"/></svg>);}
function UsersIcon(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);}
function BoxIcon(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7.3 12 12l8.7-4.7"/></svg>);}
function ReceiptIcon(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M4 3h14l2 3v14a2 2 0 0 1-2 2H4z"/><path d="M8 12h8M8 7h8M8 17h5"/></svg>);}
