import { performanceStats } from '../../data/home';

export default function StatsShowcaseSection({ stats = performanceStats }) {
  return (
    <section className="relative isolate overflow-hidden bg-white py-24 text-slate-900">
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />
        <div className="absolute left-1/2 top-[-12rem] h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-200 via-transparent to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-gradient-to-bl from-violet-200 via-transparent to-transparent blur-3xl" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 shadow-sm">
              Indicadores en vivo
            </div>
            <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">
              Tu crecimiento también es nuestro indicador clave
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Analizamos tus ventas, entregas y reposiciones para anticiparnos a la demanda. Los tableros en tiempo real te muestran cómo evoluciona tu negocio cada día.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Servicio 24/7
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5 text-slate-500"
                  aria-hidden="true"
                >
                  <path d="M10 3a7 7 0 0 0-7 7h2.5a4.5 4.5 0 1 1 4.5 4.5v2.5A7 7 0 0 0 10 3Z" />
                  <path d="M12.75 12.75 16 16" />
                </svg>
                Reportes descargables
              </span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {stats.map((stat) => (
              <article
                key={stat.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_25px_65px_-35px_rgba(15,23,42,0.2)] transition duration-300 hover:border-slate-300 hover:shadow-[0_32px_70px_-38px_rgba(15,23,42,0.25)]"
              >
                <div
                  className={`pointer-events-none absolute -right-20 top-1/2 hidden h-48 w-48 -translate-y-1/2 rounded-full bg-gradient-to-br ${stat.accent} opacity-25 blur-3xl transition duration-300 group-hover:opacity-60 sm:block`}
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                      {stat.value}
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold text-slate-600">
                      {stat.trend}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {stat.description}
                  </p>

                  <div className="mt-6 h-12 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                    <div className="h-full w-full bg-gradient-to-r from-white/0 via-white to-white/0 bg-[length:200%_100%] animate-shine" aria-hidden="true" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
