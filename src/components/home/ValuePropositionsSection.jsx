import { valueProps, workflowTimeline } from '../../data/home';

function FeatureIcon({ name, className = 'h-6 w-6 text-white' }) {
  switch (name) {
    case 'radar':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 1 0 9 9" />
          <path d="M12 3v9l3 3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'spark':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 2v4" />
          <path d="M17.657 6.343l-2.828 2.828" />
          <path d="M22 12h-4" />
          <path d="M17.657 17.657l-2.828-2.828" />
          <path d="M12 22v-4" />
          <path d="M6.343 17.657l2.828-2.828" />
          <path d="M2 12h4" />
          <path d="M6.343 6.343l2.828 2.828" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      );
    case 'route':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M7 20h10" />
          <path d="M12 4c1.657 0 3 1.567 3 3.5S13.657 11 12 11 9 9.433 9 7.5 10.343 4 12 4Z" />
          <path d="M12 11v4" />
          <path d="M7 16h10" />
          <path d="M7 12h1" />
          <path d="M16 12h1" />
          <circle cx="6" cy="12" r="1" />
          <circle cx="18" cy="12" r="1" />
        </svg>
      );
    case 'headset':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M5 15V9a7 7 0 0 1 14 0v6" />
          <path d="M5 15H3.5A1.5 1.5 0 0 0 2 16.5v1A1.5 1.5 0 0 0 3.5 19H5" />
          <path d="M19 15h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H19" />
          <path d="M12 19v2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ValuePropositionsSection({
  features = valueProps,
  steps = workflowTimeline,
}) {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at center, rgba(14, 165, 233, 0.18), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-gradient-to-br from-sky-500/20 via-blue-500/10 to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400/10 via-teal-500/10 to-transparent blur-3xl" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-200">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Operativa ágil
            </div>
            <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">
              Gestioná tu negocio con herramientas actuales
            </h2>
            <p className="mt-4 max-w-xl text-base text-white/70">
              Evolucionamos el modelo mayorista con catálogos dinámicos, condiciones personalizadas y un equipo que acompaña el crecimiento de tu tienda.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition duration-300 hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <div className="absolute -right-12 top-12 h-32 w-32 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 blur-2xl transition duration-300 group-hover:opacity-80" aria-hidden="true" />
                  <div className="relative flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-lg font-semibold text-white shadow-[0_18px_38px_rgba(15,23,42,0.45)]`}
                      >
                        <FeatureIcon name={feature.icon} className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {feature.title}
                        </h3>
                        {feature.badge && (
                          <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                            {feature.badge}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-white/60">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5 text-white/70"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 9.293a1 1 0 0 1 1.414 0L10 10.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-2 2a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 0-1.414Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      Disponible para todos los clientes activos
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-60 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_25px_65px_rgba(15,23,42,0.65)] backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  Onboarding guiado
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                  Sin costo de alta
                </span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-white">
                Sumate en tres pasos
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Nuestro equipo te acompaña desde la solicitud hasta el primer pedido para que empieces a vender sin fricciones.
              </p>

              <ol className="mt-8 space-y-6">
                {steps.map((step) => (
                  <li key={step.id} className="relative rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                    <div className="absolute -left-4 top-1/2 hidden h-20 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white/40 to-transparent md:block" aria-hidden="true" />
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-sky-100">
                        {step.id}
                      </span>
                      <div>
                        <h4 className="text-base font-semibold text-white">
                          {step.title}
                        </h4>
                        <p className="mt-1 text-sm text-white/60">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-10 flex items-center gap-3 text-xs text-white/40">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Respuesta comercial en menos de 24 h hábiles.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
