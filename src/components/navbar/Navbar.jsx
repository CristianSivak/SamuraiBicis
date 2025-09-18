import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom"; // v5

/**
 * Navbar B2B – tono luminoso por defecto
 * - Barra fija con fondo blanco translúcido y borde suave.
 * - Podés activar el modo transparente pasando transparentOnTop={true}.
 */
export default function Navbar({
  logoSrc = "/img/samurai.png", // 👈 Vite: si está en public, usalo así
  onLogin,
  transparentOnTop = false, // <- transparente solo si se solicita
  scrollOffsetPx = 8,
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > scrollOffsetPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollOffsetPx]);

  const close = () => setOpen(false);

  // Transparente solo si lo pedís por prop, estás arriba, y el menú no está abierto
  const isTransparentNow = transparentOnTop && !scrolled && !open;

  const headerBg = isTransparentNow
    ? "bg-transparent"
    : "supports-[backdrop-filter]:bg-white/80 bg-white/95 backdrop-blur border-b border-slate-200";

  const textBase = isTransparentNow ? "text-white" : "text-slate-900";
  const ringColor = isTransparentNow
    ? "focus-visible:ring-white/70"
    : "focus-visible:ring-slate-900/30";

  const linkInactive = isTransparentNow
    ? "text-white/90 hover:text-white hover:bg-white/10"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  const linkActive = isTransparentNow
    ? "text-white bg-white/20"
    : "text-slate-900 bg-white shadow-sm shadow-slate-200";

  const outlineBtn =
    "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition " +
    (isTransparentNow
      ? "border-white/40 text-white hover:bg-white/10"
      : "border-slate-200 text-slate-900 hover:bg-slate-100") +
    ` focus:outline-none focus-visible:ring-2 ${ringColor}`;

  const solidBtn =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    (isTransparentNow
      ? "bg-white text-slate-900 hover:bg-slate-100"
      : "bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 text-white shadow-lg shadow-sky-200/60 hover:shadow-xl") +
    ` focus:outline-none focus-visible:ring-2 ${ringColor}`;

  const burgerBtn =
    "inline-flex items-center justify-center rounded-xl p-2 transition " +
    (isTransparentNow
      ? "text-white hover:bg-white/10"
      : "text-slate-700 hover:bg-slate-100") +
    ` focus:outline-none focus-visible:ring-2 ${ringColor}`;

  const mobilePanel =
    "space-y-2 rounded-b-xl pb-4 pt-2 " +
    (isTransparentNow
      ? "bg-black/85 text-white backdrop-blur border-t border-white/15"
      : "border-t border-slate-200 bg-white/95 text-slate-800 backdrop-blur");

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow ${headerBg} ${
        scrolled ? "shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)]" : "shadow-none"
      }`}
      role="banner"
    >
      <nav
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${textBase}`}
        aria-label="Principal"
      >
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2" aria-label="Ir al inicio">
              <img src={logoSrc} alt="Logo" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <PrimaryLinks
              onNavigate={close}
              linkInactive={linkInactive}
              linkActive={linkActive}
              ringClass={ringColor}
            />
          </div>

          {/* Right actions (desktop) */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <LoginButton onLogin={onLogin} outlineBtn={outlineBtn} />
            <CTA solidBtn={solidBtn} />
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <button
              type="button"
              className={burgerBtn}
              aria-controls="mobile-menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span className="sr-only">Abrir menú</span>
              {!open ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm.75 5.25a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z"
                        clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 0 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div id="mobile-menu" className={`md:hidden ${open ? "block" : "hidden"}`}>
          <div className={mobilePanel}>
            <MobileLink to="/" onClick={close} exact isTransparent={isTransparentNow} ringClass={ringColor}>
              Inicio
            </MobileLink>
            <MobileLink to="/catalogo" onClick={close} isTransparent={isTransparentNow} ringClass={ringColor}>
              Catálogo
            </MobileLink>
            <MobileLink
              to="/quiero-ser-cliente"
              onClick={close}
              isTransparent={isTransparentNow}
              ringClass={ringColor}
            >
              Quiero ser cliente
            </MobileLink>
            <MobileLink to="/admin" onClick={close} isTransparent={isTransparentNow} ringClass={ringColor}>
              Admin
            </MobileLink>
            <div
              className={`border-t pt-2 ${
                isTransparentNow ? "border-white/15" : "border-slate-200/70"
              }`}
            />
            <button
              onClick={() => {
                close();
                if (onLogin) onLogin();
              }}
              className={outlineBtn + " w-full text-left"}
            >
              Ingresar
            </button>
            <Link to="/quiero-ser-cliente" onClick={close} className={solidBtn + " w-full text-center"}>
              Quiero ser cliente
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

function PrimaryLinks({ onNavigate, linkInactive, linkActive, ringClass }) {
  const base =
    `text-sm font-medium transition rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 ${ringClass}`;
  return (
    <div className="flex items-center gap-2" role="menubar">
      <NavLink exact to="/" onClick={onNavigate} className={base + " " + linkInactive} activeClassName={linkActive} role="menuitem">
        Inicio
      </NavLink>
      <NavLink to="/catalogo" onClick={onNavigate} className={base + " " + linkInactive} activeClassName={linkActive} role="menuitem">
        Catálogo
      </NavLink>
      <NavLink to="/quiero-ser-cliente" onClick={onNavigate} className={base + " " + linkInactive} activeClassName={linkActive} role="menuitem">
        Quiero ser cliente
      </NavLink>
      <NavLink to="/admin" onClick={onNavigate} className={base + " " + linkInactive} activeClassName={linkActive} role="menuitem">
        Admin
      </NavLink>
    </div>
  );
}

function CTA({ solidBtn }) {
  return (
    <Link to="/quiero-ser-cliente" className={solidBtn}>
      Quiero ser cliente
    </Link>
  );
}

function LoginButton({ onLogin, outlineBtn }) {
  return onLogin ? (
    <button onClick={onLogin} className={outlineBtn}>
      Ingresar
    </button>
  ) : (
    <Link to="/login" className={outlineBtn}>
      Ingresar
    </Link>
  );
}

function MobileLink({ to, children, onClick, exact, isTransparent, ringClass }) {
  const base =
    `block rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 ${ringClass}`;
  const colorClasses = isTransparent
    ? "text-white hover:bg-white/10"
    : "text-slate-700 hover:bg-slate-100";
  const activeClasses = isTransparent
    ? "bg-white/20 text-white"
    : "bg-white text-slate-900 shadow-sm shadow-slate-200";
  return (
    <NavLink
      exact={!!exact}
      to={to}
      onClick={onClick}
      className={`${base} ${colorClasses}`}
      activeClassName={activeClasses}
    >
      {children}
    </NavLink>
  );
}
