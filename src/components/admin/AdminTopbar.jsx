import { Link } from "react-router-dom";

export default function AdminTopbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-slate-500">
          <span className="font-semibold text-slate-800">Panel Admin</span>
          <span>•</span>
          <Link to="/" className="hover:underline">Volver a tienda</Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block">
            <input
              type="search"
              placeholder="Buscar…"
              className="rounded-xl border px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Notificaciones</button>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500" title="Mi cuenta" />
        </div>
      </div>
    </header>
  );
}
