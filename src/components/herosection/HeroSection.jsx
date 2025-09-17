import { Link } from "react-router-dom";
import imgBanner from "../../../public/img/banner.png";

export default function HeroSection({
  onLogin,
  onSignup,
  title = "¡Bienvenido a tu mayorista de bicipartes!",
  subtitle = "Accedé al catálogo actualizado, stock en tiempo real y beneficios para tu tienda.",
  bannerSrc = imgBanner,
}) {
  return (
    <section className="relative isolate">
      {/* Imagen de fondo */}
      <img
        src={bannerSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      {/* Overlay oscuro para contraste */}
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />

      {/* Contenido */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[56vh] items-center py-14 sm:py-20">
          <div className="max-w-2xl text-white">
            <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl leading-tight">
              {title}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-white/90">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row">
              {onLogin ? (
                <button
                  onClick={onLogin}
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Iniciar sesión
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Iniciar sesión
                </Link>
              )}

              {onSignup ? (
                <button
                  onClick={onSignup}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Completar formulario
                </button>
              ) : (
                <Link
                  to="/quiero-ser-cliente"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Completar formulario
                </Link>
              )}
            </div>

            {/* Beneficios rápidos */}
            <ul className="mt-5 grid grid-cols-1 gap-2 text-sm text-white/90 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                Catálogo mayorista actualizado
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                Stock y disponibilidad en tiempo real
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                Marcas oficiales y garantía
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                Atención comercial dedicada
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
