import { Link } from "react-router-dom";

/**
 * Footer – B2B mayorista
 * - Responsive (grid en desktop, stack en mobile)
 * - Incluye logo, navegación rápida, contacto y redes
 */
export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Logo y descripción */}
          <div>
            <img
              src="/img/samurai.png"
              alt="Logo"
              className="h-12 w-auto mb-3"
            />
            <p className="text-sm text-gray-400">
              Tu distribuidor mayorista de bicipartes.  
              Catálogo actualizado, stock real y atención comercial.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              Navegación
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="hover:text-white text-gray-400 transition"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogo"
                  className="hover:text-white text-gray-400 transition"
                >
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  to="/quiero-ser-cliente"
                  className="hover:text-white text-gray-400 transition"
                >
                  Quiero ser cliente
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-white text-gray-400 transition"
                >
                  Ingresar
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              Contacto
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li>
                <a href="mailto:contacto@tusitio.com" className="hover:text-white">
                  contacto@tusitio.com
                </a>
              </li>
              <li>
                <a href="tel:+5491122334455" className="hover:text-white">
                  +54 9 11 2233 4455
                </a>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              Síguenos
            </h3>
            <div className="mt-3 flex space-x-4">
              {/* Usá FontAwesome o poné SVGs propios */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white text-gray-400"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white text-gray-400"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="https://wa.me/5491122334455"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white text-gray-400"
              >
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Samurai. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
