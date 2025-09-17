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
      className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Completar formulario
    </button>
  ) : (
    <Link
      to="/quiero-ser-cliente"
      className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Completar formulario
    </Link>
  );

  const SecondaryAction = onLogin ? (
    <button
      onClick={onLogin}
      className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Ingresar al portal
    </button>
  ) : (
    <Link
      to="/login"
      className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Ingresar al portal
    </Link>
  );

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(148,163,184,0.06)_1px,transparent_0)] bg-[size:24px_24px] opacity-25" aria-hidden="true" />
        <div
          className="absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-80 blur-3xl" aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at center, rgba(56, 189, 248, 0.25), transparent 62%)",
          }}
        />
        <div className="absolute right-[-12rem] bottom-[-8rem] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-fuchsia-500/30 via-sky-400/20 to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute left-[-10rem] top-1/2 h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-gradient-to-tr from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 py-24 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              Mayoristas digitales
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-base text-white/75 sm:text-lg">
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
                  className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.04] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.45)] transition duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <div className="absolute -right-10 top-1/2 hidden h-24 w-24 -translate-y-1/2 rounded-full bg-white/20 opacity-0 blur-2xl transition duration-300 group-hover:opacity-80 sm:block" aria-hidden="true" />
                  <dt className="text-sm font-semibold text-white">
                    {item.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/70">
                    {item.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -translate-y-6 scale-[1.08] rounded-[3.25rem] bg-gradient-to-br from-white/20 via-white/10 to-transparent opacity-60 blur-3xl" aria-hidden="true" />
            <div className="relative isolate overflow-hidden rounded-[2.8rem] border border-white/15 bg-white/5 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.65)] backdrop-blur">
              <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Stock en vivo
              </div>
              <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-slate-950">
                <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
                <img
                  src={bannerSrc}
                  alt="Catálogo mayorista"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50">
                    Pedido promedio
                  </p>
                  <p className="text-base font-semibold text-white">
                    $156.000
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
                    ↑18%
                  </span>
                  <p className="text-xs text-white/60">
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
