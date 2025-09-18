// src/pages/auth/Login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, actionCodeSettings } from "../../firebase";
import { BusyButtonContent, LoadingSpinner } from "../../components/ui/LoadingIndicators";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [resetting, setResetting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.assign("/admin");
    } catch (e) {
      console.error(e);
      setErr(humanizeAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    setErr("");
    setMsg("");
    if (!email) {
      setErr("Ingresá tu email para enviarte el enlace.");
      return;
    }
    try {
      setResetting(true);
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMsg("Te enviamos un email para restablecer/definir tu contraseña.");
    } catch (e) {
      console.error(e);
      setErr(humanizeAuthError(e));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(165,180,252,0.2),_transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-slate-500" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-16 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <section className="max-w-xl space-y-6 text-slate-100">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
            Panel Samurai
          </div>
          <div>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              Administrá tu tienda con más claridad.
            </h1>
            <p className="mt-4 text-base text-slate-300 sm:text-lg">
              Iniciá sesión para acceder a métricas en tiempo real, administrar el catálogo y resolver pedidos con un flujo renovado.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Órdenes al día",
                caption: "Seguimiento instantáneo de ventas y solicitudes",
              },
              {
                title: "Inventario conectado",
                caption: "Gestioná precios, stock y visibilidad en segundos",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.9)]"
              >
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-slate-400">{item.caption}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-[0_35px_60px_-15px_rgba(15,23,42,0.6)] backdrop-blur">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Ingresar</h2>
            <p className="text-sm text-slate-400">
              Usá tu email y contraseña para entrar al panel de administración.
            </p>
          </header>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-busy={loading}>
            {err && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {msg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Contraseña</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                disabled={loading}
                className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-sky-900/50 transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
              >
                <BusyButtonContent busy={loading} busyLabel="Ingresando…" label="Ingresar" />
              </button>
              <button
                type="button"
                onClick={onForgot}
                disabled={resetting}
                className="text-sm font-medium text-sky-300 transition hover:text-sky-200 disabled:opacity-60"
              >
                {resetting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                    Enviando…
                  </span>
                ) : (
                  "Olvidé mi contraseña"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">Novedades</p>
            <p className="mt-1 leading-relaxed">
              Mejoramos las animaciones y la experiencia del panel de admin para que puedas detectar cambios de estado y cargas en tiempo real.
            </p>
          </div>
        </section>
      </div>

      {(loading || resetting) && (
        <div className="pointer-events-none absolute inset-x-0 top-0">
          <LoadingSpinner label="Procesando…" className="mx-auto mt-6 justify-center text-sky-200" />
        </div>
      )}
    </div>
  );
}

function humanizeAuthError(e) {
  const code = e?.code || "";
  if (code.includes("auth/invalid-email")) return "Email inválido.";
  if (code.includes("auth/user-not-found")) return "No existe un usuario con ese email.";
  if (code.includes("auth/wrong-password")) return "Contraseña incorrecta.";
  if (code.includes("auth/too-many-requests")) return "Demasiados intentos, probá más tarde.";
  return "No pudimos iniciar sesión. Intentá de nuevo.";
}
