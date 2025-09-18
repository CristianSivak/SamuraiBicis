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
    <section className="relative isolate overflow-hidden bg-white py-24 text-slate-900">
      <div className="absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at center, rgba(14, 165, 233, 0.16), transparent 62%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-gradient-to-br from-sky-200 via-blue-200/70 to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-200 via-teal-200/70 to-transparent blur-3xl" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Operativa ágil
            </div>
            <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">
              Gestioná tu negocio con herramientas actuales
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-600">
              Evolucionamos el modelo mayorista con catálogos dinámicos, condiciones personalizadas y un equipo que acompaña el crecimiento de tu tienda.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.15)] transition duration-300 hover:border-slate-300 hover:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.2)]"
                >
                  <div className="absolute -right-12 top-12 h-32 w-32 rounded-full bg-gradient-to-br from-sky-100 to-transparent opacity-0 blur-2xl transition duration-300 group-hover:opacity-80" aria-hidden="true" />
                  <div className="relative flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-lg font-semibold text-white shadow-[0_20px_38px_-18px_rgba(15,23,42,0.3)]`}
                      >
                        <FeatureIcon name={feature.icon} className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {feature.title}
                        </h3>
                        {feature.badge && (
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {feature.badge}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5 text-slate-500"
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
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-slate-100 via-white to-transparent opacity-80 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white p-8 shadow-[0_25px_65px_-30px_rgba(15,23,42,0.2)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  Onboarding guiado
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                  Sin costo de alta
                </span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                Sumate en tres pasos
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Nuestro equipo te acompaña desde la solicitud hasta el primer pedido para que empieces a vender sin fricciones.
              </p>

              <ol className="mt-8 space-y-6">
                {steps.map((step) => (
                  <li key={step.id} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="absolute -left-4 top-1/2 hidden h-20 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-slate-200 to-transparent md:block" aria-hidden="true" />
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-sky-700">
                        {step.id}
                      </span>
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">
                          {step.title}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-10 flex items-center gap-3 text-xs text-slate-500">
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
