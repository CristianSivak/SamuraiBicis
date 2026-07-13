import { identityStatements, coreValues } from '../../data/home';

export default function ValuePropositionsSection({
  statements = identityStatements,
  values = coreValues,
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
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Identidad Samurai
            </div>
            <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">
              Crecemos junto a la bicicletería
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-600">
              Construimos una marca cercana y confiable que comparte objetivos con cada distribuidor. Nuestra propuesta une calidad accesible, logística ágil y acompañamiento permanente.
            </p>

            <div className="mt-10 grid gap-6">
              {statements.map((statement) => (
                <article
                  key={statement.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.18)] transition duration-300 hover:border-slate-300 hover:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.22)]"
                >
                  <div
                    className={`pointer-events-none absolute -right-14 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full bg-gradient-to-br ${statement.accent} opacity-0 blur-3xl transition duration-300 group-hover:opacity-70 sm:block`}
                    aria-hidden="true"
                  />
                  <div className="relative flex flex-col gap-3">
                    <span className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                      {statement.title}
                    </span>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {statement.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-slate-100 via-white to-transparent opacity-80 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white p-8 shadow-[0_25px_65px_-30px_rgba(15,23,42,0.2)] backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                Nuestros valores
              </span>
              <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                El compromiso que nos guía cada día
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                La relación con el mayorista se sostiene en principios compartidos que hacen tangible nuestra visión.
              </p>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {values.map((value, index) => (
                  <li
                    key={value.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.28)] transition duration-300 hover:border-slate-300 hover:bg-white"
                  >
                    <div
                      className={`pointer-events-none absolute -right-14 top-1/2 hidden h-32 w-32 -translate-y-1/2 rounded-full bg-gradient-to-br ${value.accent} opacity-0 blur-3xl transition duration-300 group-hover:opacity-70 sm:block`}
                      aria-hidden="true"
                    />
                    <div className="relative flex items-start gap-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-semibold text-sky-600 shadow-[0_14px_25px_-18px_rgba(15,23,42,0.35)]">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{value.title}</p>
                        {value.description && (
                          <p className="mt-1 text-sm text-slate-600">{value.description}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Transparencia en cada entrega y acuerdo comercial.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
