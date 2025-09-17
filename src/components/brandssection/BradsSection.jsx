import { Link } from "react-router-dom";

/**
 * BrandsSection – Modern v2 (cards gris + fondo blanco)
 * - Sección con fondo blanco
 * - Cada card tiene fondo gris claro
 */
export default function BrandsSection({
  eyebrow = "Confían en nosotros",
  title = "Nuestras marcas",
  ctaHref,
  logos = [],
  logoClass = "h-16 md:h-20",
}) {
  const imgBase =
    "w-auto object-contain transition-transform duration-200 ease-out will-change-transform";
  const imgHover =
    "group-hover:scale-105 motion-reduce:group-hover:scale-100";
  const imgClass = `${imgBase} ${logoClass} ${imgHover}`;

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            {eyebrow && (
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
              {title}
            </h2>
          </div>
          {ctaHref && (
            <Link
              to={ctaHref}
              className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 sm:inline-flex"
            >
              Ver todas
              <svg
                className="ml-1 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          )}
        </div>

        {/* Mobile: carrusel con scroll-snap */}
        <div className="-mx-4 mt-6 overflow-x-auto pb-2 md:hidden">
          <ul className="mx-4 flex snap-x snap-mandatory gap-4">
            {logos.map((logo) => (
              <li
                key={logo.name}
                className="snap-start shrink-0 basis-48"
                aria-label={logo.name}
              >
                <BrandCard logo={logo} imgClass={imgClass} />
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop: grid */}
        <ul className="mt-8 hidden grid-cols-3 gap-6 sm:grid md:grid-cols-4 lg:grid-cols-6">
          {logos.map((logo) => (
            <li key={logo.name}>
              <BrandCard logo={logo} imgClass={imgClass} />
            </li>
          ))}
        </ul>

        {/* CTA móvil */}
        {ctaHref && (
          <div className="mt-6 text-center md:hidden">
            <Link
              to={ctaHref}
              className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-black/5 hover:shadow-md"
            >
              Ver todas
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function BrandCard({ logo, imgClass }) {
  const Wrapper = logo.href ? "a" : "div";
  const wrapperProps = logo.href
    ? {
        href: logo.href,
        target: "_blank",
        rel: "noopener noreferrer",
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group flex h-28 items-center justify-center rounded-xl bg-[rgb(248,248,248)] p-4 shadow-sm ring-1 ring-black/5 transition
                 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
      aria-label={logo.name}
    >
      <img
        src={logo.src}
        srcSet={logo.srcSet}
        alt={logo.name}
        loading="lazy"
        className={imgClass}
      />
    </Wrapper>
  );
}
