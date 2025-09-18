import { Link } from "react-router-dom";

export default function VideoHero({ videoId = "sChZ-IOIWOA", height = "min-h-[22rem] sm:min-h-[26rem] lg:min-h-[30rem]" }) {
  return (
    <section className="relative isolate overflow-hidden bg-white py-24 text-slate-900">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(148,163,184,0.12)_1px,transparent_0)] bg-[size:26px_26px] opacity-20" aria-hidden="true" />
        <div className="absolute inset-x-0 top-[-14rem] h-[28rem] bg-gradient-to-b from-sky-200 via-transparent to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute left-[-12rem] bottom-[-10rem] h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-sky-200 via-transparent to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute right-[-10rem] top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-gradient-to-bl from-violet-200 via-transparent to-transparent blur-3xl" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative">
            <div className="absolute inset-0 -translate-y-6 scale-[1.05] rounded-[3rem] bg-gradient-to-br from-slate-100 via-white to-transparent opacity-80 blur-3xl" aria-hidden="true" />
            <div className={`relative overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.25)] backdrop-blur-sm ${height}`}>
              <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] border border-slate-200 bg-slate-100">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&showinfo=0&rel=0`}
                  title="Video Bicicletas"
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/20" aria-hidden="true" />
                <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Showroom en vivo
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 shadow-sm">
                Experiencia Samurai
              </span>
              <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
                Recorré nuestro circuito de pruebas y live shopping
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Streamings privados, presentaciones de producto y entrenamientos para tu equipo de ventas. Sumate en remoto o visitanos en nuestro estudio para vivir la experiencia completa.
              </p>
            </div>

            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-sky-600">
                  01
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Demo de lanzamientos en vivo</p>
                  <p className="text-slate-600">Reservá un lugar para tu equipo y accedé a precios especiales durante el evento.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-sky-600">
                  02
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Laboratorio de producto</p>
                  <p className="text-slate-600">Probá componentes, consultá fichas técnicas y recibí capacitación técnica especializada.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-sky-600">
                  03
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Consultoría comercial</p>
                  <p className="text-slate-600">Planificamos promociones y lanzamientos regionales con tu ejecutivo asignado.</p>
                </div>
              </li>
            </ul>

            <div className="pt-4">
              <Link
                to="/quiero-ser-cliente"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reservar un tour virtual
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 4.22a.75.75 0 0 1 1.06 0L12 9.94l5.72-5.72a.75.75 0 1 1 1.06 1.06L13.06 11l5.72 5.72a.75.75 0 1 1-1.06 1.06L12 12.06l-5.72 5.72a.75.75 0 0 1-1.06-1.06L10.94 11 5.22 5.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
