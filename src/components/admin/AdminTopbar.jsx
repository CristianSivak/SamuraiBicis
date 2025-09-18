import { Link } from "react-router-dom";

export default function AdminTopbar({ onToggleSidebar, collapsed }) {
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
          <button className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-slate-900">
            Notificaciones
            <span className="h-2 w-2 rounded-full bg-sky-400" />
          </button>
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
