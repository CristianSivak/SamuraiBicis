function StatCard({ title, value, delta, children }) {
  const deltaColor = delta >= 0 ? "text-emerald-600" : "text-rose-600";
  const deltaSign = delta >= 0 ? "▲" : "▼";
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className={`text-xs ${deltaColor}`}>{deltaSign} {Math.abs(delta)}%</div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Spark({ points="0,20 5,15 10,18 15,12 20,14 25,9 30,11 35,5 40,8" }) {
  return (
    <svg viewBox="0 0 40 20" className="w-full h-12">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500"
        points={points}/>
    </svg>
  );
}

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-600">Resumen de métricas y actividad reciente.</p>
      </div>

      {/* KPI cards 
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Usuarios" value="1,234" delta={12}><Spark /></StatCard>
        <StatCard title="Productos" value="87" delta={3}><Spark points="0,15 5,12 10,10 15,11 20,9 25,7 30,8 35,6 40,7" /></StatCard>
        <StatCard title="Órdenes (hoy)" value="32" delta={-5}><Spark points="0,5 5,7 10,6 15,9 20,7 25,11 30,9 35,13 40,10" /></StatCard>
        <StatCard title="Ingresos" value="$ 152.300" delta={8}><Spark points="0,18 5,14 10,16 15,10 20,12 25,6 30,9 35,4 40,7" /></StatCard>
      </div>
      */}

      {/* Content split */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Órdenes recientes</h2>
          <ul className="divide-y text-sm">
            {[
              { id: 1028, cliente: "Soledad R.", total: 42990, estado: "pagada" },
              { id: 1029, cliente: "Diego M.", total: 89500, estado: "pendiente" },
              { id: 1030, cliente: "María L.", total: 221000, estado: "pagada" },
            ].map(o => (
              <li key={o.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-700">#{o.id}</span>
                  <span className="text-slate-700">{o.cliente}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                    (o.estado === "pagada" ? "bg-emerald-100 text-emerald-700" :
                     o.estado === "pendiente" ? "bg-amber-100 text-amber-800" :
                     "bg-rose-100 text-rose-700")
                  }>{o.estado}</span>
                  <span className="font-medium">$ {o.total.toLocaleString("es-AR")}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Actividad</h2>
          <ol className="space-y-3 text-sm text-slate-700">
            <li>Nuevo usuario: juan@example.com</li>
            <li>Producto “Bici Samurai Pro” actualizado</li>
            <li>Orden #1030 marcada como pagada</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
