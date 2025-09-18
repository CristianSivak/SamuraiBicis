import { Link } from "react-router-dom";
import imgBanner from "../../../public/img/banner.png";

const quickHighlights = [
  {
    id: "catalog",
    title: "Catálogo vivo",
    description: "Precios netos, múltiples listas y disponibilidad garantizada las 24 hs.",
  },
  {
    id: "brands",
    title: "+40 marcas oficiales",
    description: "Distribución directa con lanzamientos exclusivos y acuerdos comerciales.",
  },
  {
    id: "support",
    title: "Soporte dedicado",
    description: "Consultores que acompañan tu operación y activan promociones a medida.",
  },
];

export default function HeroSection({
  onLogin,
  onSignup,
  title = "Mayorista de bicipartes para comercios que quieren crecer",
  subtitle = "Centralizá compras, stock y lanzamientos exclusivos con un ecosistema pensado para tu tienda.",
  bannerSrc = imgBanner,
}) {
  const PrimaryAction = onSignup ? (
    <button
      onClick={onSignup}
      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/50"
    >
      Completar formulario
    </button>
  ) : (
    <Link
      to="/quiero-ser-cliente"
      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/50"
    >
      Completar formulario
    </Link>
  );

  const SecondaryAction = onLogin ? (
    <button
      onClick={onLogin}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
    >
      Ingresar al portal
    </button>
  ) : (
    <Link
      to="/login"
      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
    >
      Ingresar al portal
    </Link>
  );

  return (
    <section className="relative isolate overflow-hidden bg-white text-slate-900">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(148,163,184,0.12)_1px,transparent_0)] bg-[size:24px_24px] opacity-25" aria-hidden="true" />
        <div
          className="absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl" aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at center, rgba(56, 189, 248, 0.18), transparent 65%)",
          }}
        />
        <div className="absolute right-[-12rem] bottom-[-8rem] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-fuchsia-200 via-sky-200/60 to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute left-[-10rem] top-1/2 h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-gradient-to-tr from-emerald-200 via-cyan-200/60 to-transparent blur-3xl" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 py-24 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 shadow-sm">
              Mayoristas digitales
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              {PrimaryAction}
              {SecondaryAction}
            </div>

            <dl className="mt-12 grid gap-5 sm:grid-cols-2">
              {quickHighlights.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.15)] transition duration-300 hover:border-slate-300 hover:shadow-[0_24px_55px_rgba(15,23,42,0.18)]"
                >
                  <div className="absolute -right-10 top-1/2 hidden h-24 w-24 -translate-y-1/2 rounded-full bg-sky-100 opacity-0 blur-2xl transition duration-300 group-hover:opacity-80 sm:block" aria-hidden="true" />
                  <dt className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -translate-y-6 scale-[1.08] rounded-[3.25rem] bg-gradient-to-br from-slate-100 via-white to-transparent opacity-80 blur-3xl" aria-hidden="true" />
            <div className="relative isolate overflow-hidden rounded-[2.8rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.2)] backdrop-blur-sm">
              <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Stock en vivo
              </div>
              <div className="relative overflow-hidden rounded-[2.2rem] border border-slate-200 bg-slate-100">
                <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" aria-hidden="true" />
                <img
                  src={bannerSrc}
                  alt="Catálogo mayorista"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Pedido promedio
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    $156.000
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-900">
                    ↑18%
                  </span>
                  <p className="text-xs text-slate-500">
                    Crecimiento interanual de clientes activos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
